"""Auth API: register, login, logout, me."""
from __future__ import annotations

import os
import httpx
import supabase
from supabase import create_client, Client
from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def get_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class AuthRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


def set_session_cookie(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="sb_access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
    )
    response.set_cookie(
        key="sb_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,  # 30 days
    )


def clear_session_cookies(response: Response):
    response.delete_cookie("sb_access_token")
    response.delete_cookie("sb_refresh_token")


@router.post("/api/auth/register")
def register(body: RegisterRequest, response: Response):
    if not SUPABASE_URL:
        raise HTTPException(500, "Supabase not configured. Please set SUPABASE_URL environment variable.")
    if not SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Supabase service key not configured. Please set SUPABASE_SERVICE_KEY environment variable.")

    try:
        # Use Supabase Admin Auth API directly via REST for user creation
        # (client.auth.sign_up does not use admin privileges even with service role key)
        headers = {
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "application/json",
        }
        user_payload = {
            "email": body.email,
            "password": body.password,
            "email_confirm": True,  # Auto-confirm email (skip confirmation email)
            "user_metadata": {
                "name": body.name or body.email.split("@")[0],
            },
        }
        admin_url = f"{SUPABASE_URL}/auth/v1/admin/users"
        with httpx.Client(timeout=15.0) as http_client:
            user_resp = http_client.post(admin_url, headers=headers, json=user_payload)
            user_data = user_resp.json()

        if user_resp.status_code >= 400:
            err_msg = user_data.get("message") or user_data.get("msg") or user_data.get("error") or str(user_data)
            raise HTTPException(400, f"Registration failed: {err_msg}")

        user_id = user_data.get("id")
        if not user_id:
            raise HTTPException(400, "Registration failed: no user ID returned")

        # Create user profile in users table (service role bypasses RLS)
        try:
            svc = get_client()
            profile_resp = svc.table("users").upsert(
                {
                    "id": user_id,
                    "email": body.email,
                    "name": body.name or body.email.split("@")[0],
                    "plan": "free",
                },
                on_conflict="id",
            ).execute()
        except Exception as table_err:
            # Table might not exist - log but don't fail registration
            print(f"[auth] Profile upsert warning (table may not exist): {table_err}")

        return JSONResponse({
            "ok": True,
            "user": {"id": user_id, "email": body.email},
        })

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Registration failed: {str(e)}")


@router.post("/api/auth/login")
def login(body: AuthRequest, response: Response):
    if not SUPABASE_URL:
        raise HTTPException(500, "Supabase not configured")
    client = get_client()
    try:
        resp = client.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
        user = resp.user
        session = resp.session
        if not user or not session:
            raise HTTPException(401, "Invalid credentials")

        set_session_cookie(response, session.access_token, session.refresh_token)

        return JSONResponse({
            "ok": True,
            "user": {"id": user.id, "email": user.email},
        })
    except Exception as e:
        raise HTTPException(401, "Invalid email or password")


@router.post("/api/auth/logout")
def logout(response: Response):
    clear_session_cookies(response)
    return JSONResponse({"ok": True})


@router.get("/api/auth/me")
def me(request: Request, response: Response):
    token = request.cookies.get("sb_access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    if not SUPABASE_URL:
        raise HTTPException(500, "Supabase not configured")
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY)
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
    except Exception:
        raise HTTPException(401, "Invalid or expired token")

    # Fetch user profile
    svc = get_client()
    profile_resp = svc.table("users").select("*").eq("id", user.id).execute()
    profile = profile_resp.data[0] if profile_resp.data else {}

    return JSONResponse({
        "user": {
            "id": user.id,
            "email": user.email,
            "name": profile.get("name", ""),
            "plan": profile.get("plan", "free"),
        }
    })
