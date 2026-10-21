from __future__ import annotations

from collections.abc import Iterator
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from api import main
from api.auth_security import hash_password, verify_password


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    session_factory = sessionmaker(bind=test_engine, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", test_engine)
    monkeypatch.setattr(main, "SessionLocal", session_factory)

    def override_session() -> Iterator[Session]:
        session = session_factory()
        try:
            yield session
        finally:
            session.close()

    main.app.dependency_overrides[main.get_session] = override_session
    with TestClient(main.app) as test_client:
        yield test_client
    main.app.dependency_overrides.clear()
    test_engine.dispose()


def test_password_hash_is_salted_and_verifiable():
    first = hash_password("long-enough-password")
    second = hash_password("long-enough-password")

    assert first != second
    assert verify_password("long-enough-password", first)
    assert not verify_password("different-password", first)
    assert not verify_password("password", "malformed")


def test_candidate_verification_session_and_role_boundaries(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    sent_messages: list[tuple[str, str, str]] = []
    monkeypatch.setenv("RESEND_API_KEY", "test-key")
    monkeypatch.setenv("EMAIL_FROM", "Arclight <test@example.com>")
    monkeypatch.setattr(main, "send_email", lambda *message: sent_messages.append(message))

    registration = client.post(
        "/api/auth/register",
        json={"name": "Candidate One", "email": "candidate@example.com", "password": "very-secure-password"},
    )
    assert registration.status_code == 202
    assert registration.json()["status"] == "verification_email_sent"
    assert client.post(
        "/api/auth/login",
        json={"email": "candidate@example.com", "password": "very-secure-password", "role": "candidate"},
    ).status_code == 401

    token = parse_qs(urlparse(sent_messages[0][2].split("href=\"", 1)[1].split('"', 1)[0]).query)["verify"][0]
    verified = client.post("/api/auth/verify-email", json={"token": token})
    assert verified.status_code == 200
    assert verified.json()["user"]["role"] == "candidate"
    csrf_token = verified.json()["csrf_token"]
    assert client.cookies.get("arclight_session")
    assert client.get("/api/auth/session").json()["user"]["email"] == "candidate@example.com"
    assert client.get("/api/booking-slots").status_code == 200

    schedule = {
        "candidates": [],
        "interviewers": [],
        "rooms": [],
        "slots": [],
        "interviews": [],
    }
    denied = client.post(
        "/api/schedules/solve",
        json=schedule,
        headers={"X-CSRF-Token": csrf_token},
    )
    assert denied.status_code == 403

    logged_out = client.post("/api/auth/logout", headers={"X-CSRF-Token": csrf_token})
    assert logged_out.status_code == 204
    assert client.get("/api/auth/session").status_code == 401


def test_invitation_creates_only_the_invited_role_and_protects_coordinator_actions(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
):
    sent_messages: list[tuple[str, str, str]] = []
    monkeypatch.setenv("AUTH_BOOTSTRAP_TOKEN", "one-time-bootstrap-secret")
    monkeypatch.setenv("RESEND_API_KEY", "test-key")
    monkeypatch.setenv("EMAIL_FROM", "Arclight <test@example.com>")
    monkeypatch.setattr(main, "send_email", lambda *message: sent_messages.append(message))

    bootstrap = client.post(
        "/api/auth/bootstrap",
        headers={"X-Bootstrap-Token": "one-time-bootstrap-secret"},
        json={"name": "Workspace Owner", "email": "owner@example.com", "password": "owner-secure-password"},
    )
    assert bootstrap.status_code == 201
    coordinator_csrf = bootstrap.json()["csrf_token"]

    invitation = client.post(
        "/api/auth/invitations",
        headers={"X-CSRF-Token": coordinator_csrf},
        json={"email": "recruiter@example.com", "role": "recruiter"},
    )
    assert invitation.status_code == 202
    invite_url = sent_messages[0][2].split("href=\"", 1)[1].split('"', 1)[0]
    invitation_token = parse_qs(urlparse(invite_url).query)["invite"][0]
    accepted = client.post(
        "/api/auth/register/invitation",
        json={
            "name": "Recruiter One",
            "email": "recruiter@example.com",
            "password": "recruiter-secure-password",
            "invitation_token": invitation_token,
        },
    )
    assert accepted.status_code == 201
    assert accepted.json()["user"]["role"] == "recruiter"

    denied = client.post(
        "/api/booking-slots",
        headers={"X-CSRF-Token": accepted.json()["csrf_token"]},
        json={
            "id": "slot-1",
            "starts_at": "2026-11-02T09:00:00Z",
            "ends_at": "2026-11-02T10:00:00Z",
            "interviewer_ids": ["interviewer-1"],
            "room_id": "room-1",
            "capacity": 2,
        },
    )
    assert denied.status_code == 403
    assert client.post(
        "/api/auth/register/invitation",
        json={
            "name": "Another Recruiter",
            "email": "recruiter@example.com",
            "password": "another-secure-password",
            "invitation_token": invitation_token,
        },
    ).status_code == 400


def test_password_reset_revokes_existing_sessions(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    sent_messages: list[tuple[str, str, str]] = []
    monkeypatch.setenv("RESEND_API_KEY", "test-key")
    monkeypatch.setenv("EMAIL_FROM", "Arclight <test@example.com>")
    monkeypatch.setattr(main, "send_email", lambda *message: sent_messages.append(message))
    user = main.new_user("reset@example.com", "Reset User", "candidate", "original-secure-password")
    user.email_verified = True
    with main.SessionLocal() as session:
        session.add(user)
        session.commit()

    signed_in = client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": "original-secure-password"},
    )
    assert signed_in.status_code == 200
    reset_request = client.post("/api/auth/forgot-password", json={"email": "reset@example.com"})
    assert reset_request.status_code == 202

    reset_url = sent_messages[0][2].split("href=\"", 1)[1].split('"', 1)[0]
    reset_token = parse_qs(urlparse(reset_url).query)["reset"][0]
    assert client.post(
        "/api/auth/reset-password",
        json={"token": reset_token, "password": "replacement-secure-password"},
    ).status_code == 200
    assert client.get("/api/auth/session").status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": "original-secure-password"},
    ).status_code == 401
    assert client.post(
        "/api/auth/login",
        json={"email": "reset@example.com", "password": "replacement-secure-password"},
    ).status_code == 200
