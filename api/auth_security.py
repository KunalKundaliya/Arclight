from __future__ import annotations

import base64
import hashlib
import hmac
import os
import secrets
from datetime import datetime, timezone

import httpx


PASSWORD_ITERATIONS = 600_000


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS)
    return "pbkdf2_sha256${}${}${}".format(
        PASSWORD_ITERATIONS,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations_text, salt_text, digest_text = encoded.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        salt = base64.urlsafe_b64decode(salt_text.encode("ascii"))
        expected = base64.urlsafe_b64decode(digest_text.encode("ascii"))
    except (ValueError, UnicodeError):
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual, expected)


async def verify_google_id_token(id_token: str, expected_client_id: str, expected_nonce: str) -> dict[str, object]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
            response.raise_for_status()
            claims = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise ValueError("Google could not verify the sign-in response") from exc

    try:
        expires_at = int(claims.get("exp", "0"))
    except (TypeError, ValueError) as exc:
        raise ValueError("Google sign-in has an invalid expiration") from exc
    if claims.get("aud") != expected_client_id:
        raise ValueError("Google sign-in was issued for a different application")
    if expires_at <= int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("Google sign-in has expired")
    if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
        raise ValueError("Google sign-in has an invalid issuer")
    if claims.get("nonce") != expected_nonce:
        raise ValueError("Google sign-in state did not match")
    if claims.get("email_verified") not in {True, "true"}:
        raise ValueError("A verified Google email address is required")
    if not isinstance(claims.get("email"), str) or not isinstance(claims.get("sub"), str):
        raise ValueError("Google did not return a valid account")
    return claims


def send_email(recipient: str, subject: str, html: str) -> None:
    api_key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("EMAIL_FROM")
    if not api_key or not sender:
        raise RuntimeError("Email delivery is not configured")
    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {api_key}"},
            json={"from": sender, "to": [recipient], "subject": subject, "html": html},
            timeout=10,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError("The email provider could not deliver the message") from exc
