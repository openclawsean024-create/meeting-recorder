"""Vercel Python handler — wraps FastAPI ASGI app for @vercel/python runtime."""
from asgiref.compatibility import ASGI2toWSGIAdapter
from app import app as asgi_app

app = ASGI2toWSGIAdapter(asgi_app)
