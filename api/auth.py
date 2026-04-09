"""Auth API: register, login, logout, me."""
from __future__ import annotations

import os
from supabase import create_client
from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")


def get_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise HTTPException(500, "Supabase not configured")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


class AuthRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


def set_session_cookie(response: Response, access_token: str, refresh_token: str):
    secure = os.getenv("COOKIE_SECURE", "1") != "0"
    response.set_cookie(key="sb_access_token", value=access_token, httponly=True, secure=secure, samesite="lax", max_age=60 * 60 * 24 * 7)
    response.set_cookie(key="sb_refresh_token", value=refresh_token, httponly=True, secure=secure, samesite="lax", max_age=60 * 60 * 24 * 30)


def clear_session_cookies(response: Response):
    response.delete_cookie("sb_access_token")
    response.delete_cookie("sb_refresh_token")


@router.post("/api/auth/register")
def register(body: RegisterRequest, response: Response):
    client = get_client()
    try:
        resp = client.auth.sign_up({"email": body.email, "password": body.password})
        user = resp.user
        session = resp.session
        if not user:
            raise HTTPException(400, "Registration failed")
        client.table("users").upsert({"id": user.id, "email": body.email, "name": body.name or body.email.split("@")[0], "plan": "free"}, on_conflict="id").execute()
        response = JSONResponse({"ok": True, "user": {"id": user.id, "email": user.email}})
        if session:
            set_session_cookie(response, session.access_token, session.refresh_token)
        return response
    except Exception as e:
        raise HTTPException(400, str(e))


@router.post("/api/auth/login")
def login(body: AuthRequest, response: Response):
    client = get_client()
    try:
        resp = client.auth.sign_in_with_password({"email": body.email, "password": body.password})
        user = resp.user
        session = resp.session
        if not user or not session:
            raise HTTPException(401, "Invalid credentials")
        response = JSONResponse({"ok": True, "user": {"id": user.id, "email": user.email}})
        set_session_cookie(response, session.access_token, session.refresh_token)
        return response
    except Exception:
        raise HTTPException(401, "Invalid email or password")


@router.post("/api/auth/logout")
def logout(response: Response):
    clear_session_cookies(response)
    return JSONResponse({"ok": True})


@router.get("/api/auth/me")
def me(request: Request):
    token = request.cookies.get("sb_access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY)
    try:
        user_resp = client.auth.get_user(token)
        user = user_resp.user
        if not user:
            raise HTTPException(401, "Invalid token")
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    svc = get_client()
    profile_resp = svc.table("users").select("*").eq("id", user.id).execute()
    profile = profile_resp.data[0] if profile_resp.data else {}
    return JSONResponse({"user": {"id": user.id, "email": user.email, "name": profile.get("name", ""), "plan": profile.get("plan", "free")}})
