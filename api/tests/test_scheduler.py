from datetime import datetime, timedelta, timezone

from api.scheduler import (
    Candidate,
    InterviewDemand,
    Interviewer,
    Room,
    ScheduleRequest,
    ScheduledInterview,
    TimeSlot,
    recover_after_cancellation,
    solve_schedule,
)


def make_slot(slot_id: str, hour: int) -> TimeSlot:
    start = datetime(2026, 11, 2, hour, tzinfo=timezone.utc)
    return TimeSlot(id=slot_id, starts_at=start, ends_at=start + timedelta(hours=1))


def test_solver_respects_round_order_skills_and_no_overlaps():
    request = ScheduleRequest(
        candidates=[
            Candidate(
                id="candidate-1",
                available_slot_ids={"nine", "ten"},
                eligible_rounds={"Coding", "Technical"},
            )
        ],
        interviewers=[
            Interviewer(id="engineer", skills={"python"}, available_slot_ids={"nine", "ten"})
        ],
        rooms=[Room(id="room-a", capacity=3, available_slot_ids={"nine", "ten"})],
        slots=[make_slot("nine", 9), make_slot("ten", 10)],
        interviews=[
            InterviewDemand(
                id="coding",
                candidate_id="candidate-1",
                round="Coding",
                required_skills={"python"},
                duration_minutes=45,
            ),
            InterviewDemand(
                id="technical",
                candidate_id="candidate-1",
                round="Technical",
                required_skills={"python"},
                duration_minutes=45,
            ),
        ],
    )

    result = solve_schedule(request)
    by_round = {item.round: item for item in result.assignments}

    assert not result.unscheduled_interview_ids
    assert by_round["Coding"].ends_at <= by_round["Technical"].starts_at
    assert all(item.interviewer_ids == ["engineer"] for item in result.assignments)
    assert len({item.slot_id for item in result.assignments}) == 2


def test_ineligible_round_is_not_scheduled():
    request = ScheduleRequest(
        candidates=[
            Candidate(id="candidate-1", available_slot_ids={"nine"}, eligible_rounds={"HR"})
        ],
        interviewers=[Interviewer(id="hr", skills={"culture"}, available_slot_ids={"nine"})],
        rooms=[Room(id="room-a", capacity=2, available_slot_ids={"nine"})],
        slots=[make_slot("nine", 9)],
        interviews=[
            InterviewDemand(
                id="hr-round",
                candidate_id="candidate-1",
                round="HR",
                required_skills={"culture"},
                duration_minutes=30,
            )
        ],
    )

    result = solve_schedule(request)

    assert result.assignments == []
    assert result.unscheduled_interview_ids == ["hr-round"]


def test_cancellation_recovery_preserves_unaffected_bookings():
    slots = [make_slot("nine", 9), make_slot("ten", 10), make_slot("eleven", 11)]
    request = ScheduleRequest(
        candidates=[
            Candidate(id="candidate-1", available_slot_ids={"nine", "eleven"}, eligible_rounds={"Coding"}),
            Candidate(id="candidate-2", available_slot_ids={"ten"}, eligible_rounds={"Coding"}),
        ],
        interviewers=[
            Interviewer(id="alex", skills={"python"}, available_slot_ids={"nine"}),
            Interviewer(id="sam", skills={"python"}, available_slot_ids={"ten", "eleven"}),
        ],
        rooms=[Room(id="room-a", capacity=2, available_slot_ids={"nine", "ten", "eleven"})],
        slots=slots,
        interviews=[
            InterviewDemand(
                id="affected",
                candidate_id="candidate-1",
                round="Coding",
                required_skills={"python"},
                duration_minutes=45,
            ),
            InterviewDemand(
                id="unaffected",
                candidate_id="candidate-2",
                round="Coding",
                required_skills={"python"},
                duration_minutes=45,
            ),
        ],
    )
    existing = [
        ScheduledInterview(
            interview_id="affected",
            candidate_id="candidate-1",
            round="Coding",
            slot_id="nine",
            starts_at=slots[0].starts_at,
            ends_at=slots[0].starts_at + timedelta(minutes=45),
            room_id="room-a",
            interviewer_ids=["alex"],
        ),
        ScheduledInterview(
            interview_id="unaffected",
            candidate_id="candidate-2",
            round="Coding",
            slot_id="ten",
            starts_at=slots[1].starts_at,
            ends_at=slots[1].starts_at + timedelta(minutes=45),
            room_id="room-a",
            interviewer_ids=["sam"],
        ),
    ]

    result = recover_after_cancellation(request, "alex", existing)

    assert result.moved_candidate_count == 1
    assert result.unscheduled_interview_ids == []
    unaffected = next(item for item in result.assignments if item.interview_id == "unaffected")
    affected = next(item for item in result.assignments if item.interview_id == "affected")
    assert unaffected == existing[1]
    assert affected.slot_id == "eleven"
    assert "alex" not in affected.interviewer_ids
