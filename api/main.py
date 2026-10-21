from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Generator

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint, create_engine, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker

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
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
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


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/candidates", status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate, session: Session = Depends(get_session)) -> dict[str, str]:
    candidate = CandidateRecord(**payload.model_dump())
    session.add(candidate)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise HTTPException(status_code=409, detail="Candidate ID or email already exists") from exc
    return {"id": candidate.id, "name": candidate.name, "email": candidate.email}


@app.post("/api/booking-slots", status_code=status.HTTP_201_CREATED)
def create_booking_slot(payload: SlotCreate, session: Session = Depends(get_session)) -> dict[str, str]:
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
def list_booking_slots(session: Session = Depends(get_session)) -> list[dict[str, object]]:
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
def book_slot(payload: BookingRequest, session: Session = Depends(get_session)) -> BookingResponse:
    try:
        with session.begin():
            candidate = session.scalar(
                select(CandidateRecord)
                .where(CandidateRecord.id == payload.candidate_id)
                .with_for_update()
            )
            if candidate is None:
                raise HTTPException(status_code=404, detail="Candidate was not found")
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
def cancel_booking(booking_id: int, session: Session = Depends(get_session)) -> None:
    booking = session.get(CandidateBooking, booking_id)
    if booking is None:
        raise HTTPException(status_code=404, detail="Booking was not found")
    session.delete(booking)
    session.commit()


@app.post("/api/schedules/solve", response_model=ScheduleResult)
def schedule(request: ScheduleRequest) -> ScheduleResult:
    try:
        return solve_schedule(request)
    except RuntimeError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/schedules/recover", response_model=ScheduleResult)
def recover_schedule(payload: RecoveryRequest) -> ScheduleResult:
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
