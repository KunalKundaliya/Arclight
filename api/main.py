from __future__ import annotations

import os
import hashlib
import base64
import secrets
from dataclasses import dataclass
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Generator, Literal
from urllib.parse import urlencode

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

from .auth_security import hash_password, new_token, send_email, token_hash, verify_google_id_token, verify_password
from .scheduler import (
    ScheduleRequest,
    ScheduleResult,
    ScheduledInterview,
    recover_after_cancellation,
    solve_schedule,
)


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://arclight:arclight@localhost:5432/arclight",
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class SchedulingResource(Base):
    __tablename__ = "scheduling_resources"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)


class CandidateRecord(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    drive_id: Mapped[str] = mapped_column(String(64), index=True)
    bookings: Mapped[list[CandidateBooking]] = relationship(back_populates="candidate")


class BookingSlot(Base):
    __tablename__ = "booking_slots"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    interviewer_ids: Mapped[str] = mapped_column(String(1000))
    room_id: Mapped[str] = mapped_column(String(64))
    capacity: Mapped[int] = mapped_column(Integer, default=1)
    bookings: Mapped[list[CandidateBooking]] = relationship(back_populates="slot")


class CandidateBooking(Base):
    __tablename__ = "candidate_bookings"
    __table_args__ = (
        UniqueConstraint("candidate_id", "slot_id", name="uq_candidate_slot"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), index=True)
    slot_id: Mapped[str] = mapped_column(ForeignKey("booking_slots.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    candidate: Mapped[CandidateRecord] = relationship(back_populates="bookings")
    slot: Mapped[BookingSlot] = relationship(back_populates="bookings")


class AuthUser(Base):
    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(24), index=True)
    password_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    email_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuthSession(Base):
    __tablename__ = "auth_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("auth_users.id", ondelete="CASCADE"), index=True)
    csrf_hash: Mapped[str] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuthActionToken(Base):
    __tablename__ = "auth_action_tokens"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    token_type: Mapped[str] = mapped_column(String(32), index=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    role: Mapped[str | None] = mapped_column(String(24), nullable=True)
    verifier: Mapped[str | None] = mapped_column(String(128), nullable=True)
    nonce: Mapped[str | None] = mapped_column(String(128), nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Arclight Placement Scheduling API",
    version="0.1.0",
    description="Constraint-aware placement scheduling, candidate booking, and calendar export.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


class BookingRequest(BaseModel):
    candidate_id: str = Field(min_length=1, max_length=64)
    slot_id: str = Field(min_length=1, max_length=64)


class BookingResponse(BaseModel):
    id: int
    candidate_id: str
    slot_id: str
    starts_at: datetime
    ends_at: datetime
    calendar_ics: str


class CandidateCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    drive_id: str = Field(min_length=1, max_length=64)


class SlotCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    starts_at: datetime
    ends_at: datetime
    interviewer_ids: list[str]
    room_id: str = Field(min_length=1, max_length=64)
    capacity: int = Field(default=1, ge=1)


class RecoveryRequest(BaseModel):
    schedule: ScheduleRequest
    cancelled_interviewer_id: str
    existing_assignments: list[ScheduledInterview]


Role = Literal["candidate", "recruiter", "coordinator"]


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)


class InvitationRegistrationRequest(RegisterRequest):
    invitation_token: str = Field(min_length=20, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    role: Role | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=128)
    password: str = Field(min_length=12, max_length=128)


class VerifyEmailRequest(BaseModel):
    token: str = Field(min_length=20, max_length=128)


class InvitationRequest(BaseModel):
    email: EmailStr
    role: Literal["recruiter", "coordinator"]


DUMMY_PASSWORD_HASH = hash_password("Arclight-invalid-password-placeholder")


@dataclass
class AuthContext:
    user: AuthUser
    session: AuthSession


def normalized_email(email: str) -> str:
    return email.strip().lower()


def load_action_token(session: Session, raw_token: str) -> AuthActionToken | None:
    return session.scalar(
        select(AuthActionToken)
        .where(AuthActionToken.token_hash == token_hash(raw_token))
        .with_for_update()
    )


def action_token_expired(action: AuthActionToken | None, now: datetime) -> bool:
    if action is None:
        return True
    expires_at = action.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= now


def user_payload(user: AuthUser) -> dict[str, str]:
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def set_session_cookies(
    response: Response,
    user: AuthUser,
    session: Session,
    request: Request | None = None,
) -> str:
    if request is not None:
        existing_token = request.cookies.get("arclight_session")
        if existing_token:
            existing_session = session.get(AuthSession, token_hash(existing_token))
            if existing_session is not None and existing_session.revoked_at is None:
                existing_session.revoked_at = datetime.now(timezone.utc)
    raw_session = new_token()
    csrf_token = new_token()
    session.add(AuthSession(
        token_hash=token_hash(raw_session),
        user_id=user.id,
        csrf_hash=token_hash(csrf_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    ))
    session.commit()
    secure = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        "arclight_session",
        raw_session,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        "arclight_csrf",
        csrf_token,
        max_age=7 * 24 * 60 * 60,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )
    return csrf_token


def get_current_auth(
    request: Request,
    session: Session = Depends(get_session),
) -> AuthContext:
    raw_token = request.cookies.get("arclight_session")
    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication is required")
    auth_session = session.get(AuthSession, token_hash(raw_token))
    now = datetime.now(timezone.utc)
    expires_at = auth_session.expires_at if auth_session else now
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if auth_session is None or auth_session.revoked_at is not None or expires_at <= now:
        raise HTTPException(status_code=401, detail="Your session has expired")
    user = session.get(AuthUser, auth_session.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Your account is unavailable")
    return AuthContext(user=user, session=auth_session)


def require_roles(*roles: str):
    def dependency(auth: AuthContext = Depends(get_current_auth)) -> AuthContext:
        if auth.user.role not in roles:
            raise HTTPException(status_code=403, detail="Your role cannot access this resource")
        return auth
    return dependency


def require_csrf(
    request: Request,
    auth: AuthContext = Depends(get_current_auth),
) -> AuthContext:
    cookie_token = request.cookies.get("arclight_csrf", "")
    header_token = request.headers.get("x-csrf-token", "")
    if (
        not cookie_token
        or not secrets.compare_digest(cookie_token, header_token)
        or not secrets.compare_digest(token_hash(cookie_token), auth.session.csrf_hash)
    ):
        raise HTTPException(status_code=403, detail="CSRF validation failed")
    return auth


def require_role_csrf(*roles: str):
    def dependency(auth: AuthContext = Depends(require_csrf)) -> AuthContext:
        if auth.user.role not in roles:
            raise HTTPException(status_code=403, detail="Your role cannot access this resource")
        return auth
    return dependency


def new_user(email: str, name: str, role: str, password: str | None = None) -> AuthUser:
    return AuthUser(
        id=secrets.token_hex(16),
        email=normalized_email(email),
        name=name.strip(),
        role=role,
        password_hash=hash_password(password) if password is not None else None,
    )


@app.post("/api/auth/register", status_code=status.HTTP_202_ACCEPTED)
def register_candidate(
    payload: RegisterRequest,
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if not os.getenv("RESEND_API_KEY") or not os.getenv("EMAIL_FROM"):
        raise HTTPException(status_code=503, detail="Email verification is not configured")
    user = new_user(payload.email, payload.name, "candidate", payload.password)
    session.add(user)
    try:
        session.flush()
        raw_token = new_token()
        verification_action = AuthActionToken(
            token_hash=token_hash(raw_token),
            token_type="email_verification",
            email=user.email,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        session.add(verification_action)
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
    verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')}/?verify={raw_token}"
    try:
        send_email(user.email, "Verify your Arclight account", f'<p><a href="{verification_url}">Verify email</a></p>')
    except RuntimeError as exc:
        session.delete(user)
        session.delete(verification_action)
        session.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "verification_email_sent"}


@app.post("/api/auth/verify-email")
def verify_email(
    payload: VerifyEmailRequest,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    action = load_action_token(session, payload.token)
    now = datetime.now(timezone.utc)
    if (
        action is None
        or action.token_type != "email_verification"
        or action.used_at is not None
        or action_token_expired(action, now)
        or action.email is None
    ):
        raise HTTPException(status_code=400, detail="The verification link is invalid or has expired")
    user = session.scalar(select(AuthUser).where(AuthUser.email == action.email).with_for_update())
    if user is None:
        raise HTTPException(status_code=400, detail="The verification link is invalid or has expired")
    user.email_verified = True
    action.used_at = now
    csrf_token = set_session_cookies(response, user, session, request)
    return {"user": user_payload(user), "csrf_token": csrf_token}


@app.post("/api/auth/register/invitation", status_code=status.HTTP_201_CREATED)
def register_invited_user(
    payload: InvitationRegistrationRequest,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    action = load_action_token(session, payload.invitation_token)
    now = datetime.now(timezone.utc)
    if (
        action is None
        or action.token_type != "invitation"
        or action.used_at is not None
        or action_token_expired(action, now)
        or action.email != normalized_email(payload.email)
        or action.role not in {"recruiter", "coordinator"}
    ):
        raise HTTPException(status_code=400, detail="The invitation is invalid or has expired")
    user = new_user(payload.email, payload.name, action.role, payload.password)
    user.email_verified = True
    action.used_at = now
    session.add(user)
    try:
        session.flush()
        csrf_token = set_session_cookies(response, user, session, request)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
    return {"user": user_payload(user), "csrf_token": csrf_token}


@app.post("/api/auth/login")
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    user = session.scalar(select(AuthUser).where(AuthUser.email == normalized_email(payload.email)))
    password_hash = user.password_hash if user and user.password_hash else DUMMY_PASSWORD_HASH
    password_matches = verify_password(payload.password, password_hash)
    if (
        user is None
        or user.password_hash is None
        or not user.email_verified
        or not password_matches
        or (payload.role is not None and user.role != payload.role)
    ):
        raise HTTPException(status_code=401, detail="Email, password, or selected workspace is incorrect")
    csrf_token = set_session_cookies(response, user, session, request)
    return {"user": user_payload(user), "csrf_token": csrf_token}


@app.get("/api/auth/session")
def get_auth_session(
    request: Request,
    auth: AuthContext = Depends(get_current_auth),
) -> dict[str, object]:
    csrf_token = request.cookies.get("arclight_csrf", "")
    if not csrf_token or not secrets.compare_digest(token_hash(csrf_token), auth.session.csrf_hash):
        raise HTTPException(status_code=401, detail="Your session has expired")
    return {"user": user_payload(auth.user), "csrf_token": csrf_token}


@app.post("/api/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    auth: AuthContext = Depends(require_csrf),
    session: Session = Depends(get_session),
) -> None:
    auth.session.revoked_at = datetime.now(timezone.utc)
    session.commit()
    secure = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
    response.delete_cookie("arclight_session", path="/", samesite="lax", secure=secure)
    response.delete_cookie("arclight_csrf", path="/", samesite="lax", secure=secure)


@app.post("/api/auth/bootstrap", status_code=status.HTTP_201_CREATED)
def bootstrap_coordinator(
    payload: RegisterRequest,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
) -> dict[str, object]:
    bootstrap_token = os.getenv("AUTH_BOOTSTRAP_TOKEN")
    supplied_token = request.headers.get("x-bootstrap-token", "")
    if not bootstrap_token or not secrets.compare_digest(bootstrap_token, supplied_token):
        raise HTTPException(status_code=403, detail="A valid bootstrap token is required")
    if session.scalar(select(AuthUser.id).where(AuthUser.role == "coordinator")) is not None:
        raise HTTPException(status_code=409, detail="A coordinator account has already been created")
    user = new_user(payload.email, payload.name, "coordinator", payload.password)
    user.email_verified = True
    session.add(user)
    try:
        session.flush()
        csrf_token = set_session_cookies(response, user, session, request)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
    return {"user": user_payload(user), "csrf_token": csrf_token}


@app.post("/api/auth/invitations", status_code=status.HTTP_202_ACCEPTED)
def create_invitation(
    payload: InvitationRequest,
    auth: AuthContext = Depends(require_csrf),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if auth.user.role != "coordinator":
        raise HTTPException(status_code=403, detail="Only coordinators can invite workspace members")
    email = normalized_email(payload.email)
    if session.scalar(select(AuthUser.id).where(AuthUser.email == email)) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    raw_token = new_token()
    action = AuthActionToken(
        token_hash=token_hash(raw_token),
        token_type="invitation",
        email=email,
        role=payload.role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    session.add(action)
    session.commit()
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    invitation_url = f"{frontend_url}/?invite={raw_token}"
    try:
        send_email(
            email,
            "Your Arclight workspace invitation",
            f'<p>You have been invited to join Arclight as a {payload.role}.</p>'
            f'<p><a href="{invitation_url}">Accept invitation</a></p>',
        )
    except RuntimeError as exc:
        action.used_at = datetime.now(timezone.utc)
        session.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "invitation_sent"}


@app.post("/api/auth/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, session: Session = Depends(get_session)) -> dict[str, str]:
    if not os.getenv("RESEND_API_KEY") or not os.getenv("EMAIL_FROM"):
        raise HTTPException(status_code=503, detail="Password recovery email is not configured")
    user = session.scalar(select(AuthUser).where(AuthUser.email == normalized_email(payload.email)))
    if user is None:
        return {"status": "If the account exists, recovery instructions will be sent"}
    raw_token = new_token()
    session.add(AuthActionToken(
        token_hash=token_hash(raw_token),
        token_type="password_reset",
        email=user.email,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    ))
    session.commit()
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')}/?reset={raw_token}"
    try:
        send_email(user.email, "Reset your Arclight password", f'<p><a href="{reset_url}">Reset password</a></p>')
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {"status": "If the account exists, recovery instructions will be sent"}


@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session)) -> dict[str, str]:
    action = load_action_token(session, payload.token)
    now = datetime.now(timezone.utc)
    if (
        action is None
        or action.token_type != "password_reset"
        or action.used_at is not None
        or action_token_expired(action, now)
        or action.email is None
    ):
        raise HTTPException(status_code=400, detail="The password reset link is invalid or has expired")
    user = session.scalar(select(AuthUser).where(AuthUser.email == action.email).with_for_update())
    if user is None:
        raise HTTPException(status_code=400, detail="The password reset link is invalid or has expired")
    user.password_hash = hash_password(payload.password)
    action.used_at = now
    active_sessions = session.scalars(
        select(AuthSession).where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
    ).all()
    for auth_session in active_sessions:
        auth_session.revoked_at = now
    session.commit()
    return {"status": "Password updated"}


@app.get("/api/auth/google/start")
def google_start(
    role: Role,
    session: Session = Depends(get_session),
) -> RedirectResponse:
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not client_id or not redirect_uri:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    state = new_token()
    nonce = new_token()
    verifier = new_token()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode("ascii")).digest()
    ).decode("ascii").rstrip("=")
    session.add(AuthActionToken(
        token_hash=token_hash(state),
        token_type="google_state",
        role=role,
        verifier=verifier,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    session.commit()
    query = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@app.get("/api/auth/google/callback")
async def google_callback(
    request: Request,
    code: str = Query(min_length=1),
    state: str = Query(min_length=20),
    session: Session = Depends(get_session),
) -> RedirectResponse:
    action = load_action_token(session, state)
    now = datetime.now(timezone.utc)
    if (
        action is None
        or action.token_type != "google_state"
        or action.used_at is not None
        or action_token_expired(action, now)
        or action.verifier is None
        or action.nonce is None
        or action.role not in {"candidate", "recruiter", "coordinator"}
    ):
        raise HTTPException(status_code=400, detail="Google sign-in state is invalid or expired")
    action.used_at = now
    session.commit()

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                    "code_verifier": action.verifier,
                },
            )
            token_response.raise_for_status()
            tokens = token_response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=401, detail="Google sign-in could not be completed") from exc
    id_token = tokens.get("id_token")
    if not isinstance(id_token, str):
        raise HTTPException(status_code=401, detail="Google did not return an identity token")
    try:
        claims = await verify_google_id_token(id_token, client_id, action.nonce)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    email = normalized_email(str(claims["email"]))
    user = session.scalar(select(AuthUser).where(AuthUser.google_sub == claims["sub"]))
    if user is None:
        user = session.scalar(select(AuthUser).where(AuthUser.email == email))
    if user is None:
        if action.role != "candidate":
            raise HTTPException(status_code=403, detail="Recruiter and coordinator accounts require an invitation")
        display_name = claims.get("name")
        user = new_user(email, str(display_name) if display_name else email, "candidate")
        user.google_sub = str(claims["sub"])
        user.email_verified = True
        session.add(user)
    elif user.role != action.role:
        raise HTTPException(status_code=403, detail="This account cannot access the selected workspace")
    elif user.google_sub not in {None, str(claims["sub"])}:
        raise HTTPException(status_code=409, detail="A different Google account is linked to this email")
    else:
        user.google_sub = str(claims["sub"])
        user.email_verified = True
    try:
        session.flush()
        response = RedirectResponse(os.getenv("FRONTEND_URL", "http://localhost:5173"), status_code=303)
        set_session_cookies(response, user, session, request)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="This Google account is already linked") from exc
    return response


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/candidates", status_code=status.HTTP_201_CREATED)
def create_candidate(
    payload: CandidateCreate,
    auth: AuthContext = Depends(require_role_csrf("recruiter", "coordinator")),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    candidate = CandidateRecord(**payload.model_dump())
    session.add(candidate)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Candidate ID or email already exists") from exc
    return {"id": candidate.id, "name": candidate.name, "email": candidate.email}


@app.post("/api/booking-slots", status_code=status.HTTP_201_CREATED)
def create_booking_slot(
    payload: SlotCreate,
    auth: AuthContext = Depends(require_role_csrf("coordinator")),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    if payload.starts_at.tzinfo is None or payload.ends_at.tzinfo is None or payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=422, detail="Provide a valid, timezone-aware booking interval")
    slot = BookingSlot(
        id=payload.id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        interviewer_ids=",".join(payload.interviewer_ids),
        room_id=payload.room_id,
        capacity=payload.capacity,
    )
    resources = [
        SchedulingResource(id=f"interviewer:{person_id}")
        for person_id in payload.interviewer_ids
    ]
    resources.append(SchedulingResource(id=f"room:{payload.room_id}"))
    try:
        with session.begin():
            for resource in resources:
                session.merge(resource)
            session.add(slot)
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Booking slot already exists") from exc
    return {"id": slot.id, "status": "available"}


@app.get("/api/booking-slots")
def list_booking_slots(
    auth: AuthContext = Depends(require_roles("candidate")),
    session: Session = Depends(get_session),
) -> list[dict[str, object]]:
    slots = session.scalars(select(BookingSlot).order_by(BookingSlot.starts_at)).all()
    results = []
    for slot in slots:
        used = session.scalar(select(func.count(CandidateBooking.id)).where(CandidateBooking.slot_id == slot.id)) or 0
        if used < slot.capacity:
            results.append({
                "id": slot.id,
                "starts_at": slot.starts_at,
                "ends_at": slot.ends_at,
                "remaining_capacity": slot.capacity - used,
            })
    return results


@app.post("/api/bookings", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def book_slot(
    payload: BookingRequest,
    auth: AuthContext = Depends(require_role_csrf("candidate")),
    session: Session = Depends(get_session),
) -> BookingResponse:
    try:
        with session.begin():
            candidate = session.scalar(
                select(CandidateRecord)
                .where(CandidateRecord.id == payload.candidate_id)
                .with_for_update()
            )
            if candidate is None:
                raise HTTPException(status_code=404, detail="Candidate was not found")
            if normalized_email(candidate.email) != auth.user.email:
                raise HTTPException(status_code=403, detail="You can only book an interview for your own candidate profile")
            slot = session.scalar(
                select(BookingSlot)
                .where(BookingSlot.id == payload.slot_id)
                .with_for_update()
            )
            if slot is None:
                raise HTTPException(status_code=404, detail="Booking slot was not found")
            if slot.starts_at <= datetime.now(slot.starts_at.tzinfo):
                raise HTTPException(status_code=409, detail="This interview slot has already started")
            resource_ids = [
                *(f"interviewer:{person_id}" for person_id in slot.interviewer_ids.split(",") if person_id),
                f"room:{slot.room_id}",
            ]
            locked_resources = session.scalars(
                select(SchedulingResource)
                .where(SchedulingResource.id.in_(resource_ids))
                .order_by(SchedulingResource.id)
                .with_for_update()
            ).all()
            if len(locked_resources) != len(set(resource_ids)):
                raise HTTPException(status_code=409, detail="The slot's scheduling resources are unavailable")
            existing = session.scalar(
                select(CandidateBooking)
                .join(BookingSlot)
                .where(
                    CandidateBooking.candidate_id == candidate.id,
                    BookingSlot.starts_at < slot.ends_at,
                    BookingSlot.ends_at > slot.starts_at,
                )
            )
            if existing is not None:
                raise HTTPException(status_code=409, detail="You already have an interview at this time")
            overlapping_bookings = session.execute(
                select(CandidateBooking, BookingSlot)
                .join(BookingSlot, CandidateBooking.slot_id == BookingSlot.id)
                .where(
                    BookingSlot.starts_at < slot.ends_at,
                    BookingSlot.ends_at > slot.starts_at,
                )
            ).all()
            requested_interviewers = set(slot.interviewer_ids.split(",")) - {""}
            for _, other_slot in overlapping_bookings:
                other_interviewers = set(other_slot.interviewer_ids.split(",")) - {""}
                if other_slot.room_id == slot.room_id or requested_interviewers.intersection(other_interviewers):
                    raise HTTPException(
                        status_code=409,
                        detail="An interviewer or room for this time has just been booked",
                    )
            used = session.scalar(
                select(func.count(CandidateBooking.id))
                .where(CandidateBooking.slot_id == slot.id)
            ) or 0
            if used >= slot.capacity:
                raise HTTPException(status_code=409, detail="This interview slot is no longer available")
            booking = CandidateBooking(candidate_id=candidate.id, slot_id=slot.id)
            session.add(booking)
            session.flush()
            booking_result = BookingResponse(
                id=booking.id,
                candidate_id=candidate.id,
                slot_id=slot.id,
                starts_at=slot.starts_at,
                ends_at=slot.ends_at,
                calendar_ics=make_ics(booking.id, candidate.name, slot),
            )
        return booking_result
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="This slot was booked in another session. Please choose another.") from exc


@app.delete("/api/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking(
    booking_id: int,
    auth: AuthContext = Depends(require_role_csrf("candidate", "recruiter", "coordinator")),
    session: Session = Depends(get_session),
) -> None:
    booking = session.get(CandidateBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking was not found")
    if auth.user.role == "candidate" and booking.candidate.email != auth.user.email:
        raise HTTPException(status_code=403, detail="You can only cancel your own interview")
    session.delete(booking)
    session.commit()


@app.post("/api/schedules/solve", response_model=ScheduleResult)
def schedule(
    request: ScheduleRequest,
    auth: AuthContext = Depends(require_role_csrf("coordinator")),
) -> ScheduleResult:
    try:
        return solve_schedule(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/schedules/recover", response_model=ScheduleResult)
def recover_schedule(
    payload: RecoveryRequest,
    auth: AuthContext = Depends(require_role_csrf("coordinator")),
) -> ScheduleResult:
    try:
        return recover_after_cancellation(
            payload.schedule,
            payload.cancelled_interviewer_id,
            payload.existing_assignments,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


def make_ics(booking_id: int, candidate_name: str, slot: BookingSlot) -> str:
    def ics_time(value: datetime) -> str:
        return value.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    safe_name = candidate_name.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
    return "\r\n".join([
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Arclight//Placement Interview//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        f"UID:arclight-booking-{booking_id}@arclight.example",
        f"DTSTAMP:{ics_time(datetime.now().astimezone())}",
        f"DTSTART:{ics_time(slot.starts_at)}",
        f"DTEND:{ics_time(slot.ends_at)}",
        f"SUMMARY:Placement interview — {safe_name}",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
    ])
