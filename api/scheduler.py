from __future__ import annotations

from datetime import datetime, timedelta
from itertools import combinations
from typing import Literal

from ortools.sat.python import cp_model
from pydantic import BaseModel, Field, model_validator


ROUND_ORDER = {"Coding": 0, "Technical": 1, "HR": 2}


class Candidate(BaseModel):
    id: str
    available_slot_ids: set[str]
    eligible_rounds: set[str] = Field(default_factory=lambda: set(ROUND_ORDER))
    completed_rounds: set[str] = Field(default_factory=set)


class Interviewer(BaseModel):
    id: str
    skills: set[str]
    available_slot_ids: set[str]


class Room(BaseModel):
    id: str
    capacity: int = Field(ge=2)
    available_slot_ids: set[str]


class TimeSlot(BaseModel):
    id: str
    starts_at: datetime
    ends_at: datetime

    @model_validator(mode="after")
    def validate_interval(self) -> TimeSlot:
        if self.starts_at.tzinfo is None or self.ends_at.tzinfo is None:
            raise ValueError("Time slots must use timezone-aware datetimes")
        if self.ends_at <= self.starts_at:
            raise ValueError("A time slot must end after it starts")
        return self


class InterviewDemand(BaseModel):
    id: str
    candidate_id: str
    round: Literal["Coding", "Technical", "HR"]
    required_skills: set[str] = Field(default_factory=set)
    duration_minutes: int = Field(gt=0, le=240)
    panel_size: int = Field(default=1, ge=1, le=8)


class FixedAssignment(BaseModel):
    candidate_id: str
    starts_at: datetime
    ends_at: datetime
    interviewer_ids: list[str]
    room_id: str


class ScheduleRequest(BaseModel):
    candidates: list[Candidate]
    interviewers: list[Interviewer]
    rooms: list[Room]
    slots: list[TimeSlot]
    interviews: list[InterviewDemand]
    fixed_assignments: list[FixedAssignment] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_references(self) -> ScheduleRequest:
        candidate_ids = [candidate.id for candidate in self.candidates]
        slot_ids = [slot.id for slot in self.slots]
        if len(candidate_ids) != len(set(candidate_ids)):
            raise ValueError("Candidate IDs must be unique")
        if len(slot_ids) != len(set(slot_ids)):
            raise ValueError("Time slot IDs must be unique")
        if len({interviewer.id for interviewer in self.interviewers}) != len(self.interviewers):
            raise ValueError("Interviewer IDs must be unique")
        if len({room.id for room in self.rooms}) != len(self.rooms):
            raise ValueError("Room IDs must be unique")
        if any(item.candidate_id not in set(candidate_ids) for item in self.interviews):
            raise ValueError("Every interview must reference a known candidate")
        if len({item.id for item in self.interviews}) != len(self.interviews):
            raise ValueError("Interview IDs must be unique")
        if len({(item.candidate_id, item.round) for item in self.interviews}) != len(self.interviews):
            raise ValueError("A candidate can have only one scheduled demand per round")
        return self


class ScheduledInterview(BaseModel):
    interview_id: str
    candidate_id: str
    round: str
    slot_id: str
    starts_at: datetime
    ends_at: datetime
    room_id: str
    interviewer_ids: list[str]


class ScheduleResult(BaseModel):
    status: str
    assignments: list[ScheduledInterview]
    unscheduled_interview_ids: list[str]
    objective_value: int
    moved_candidate_count: int = 0


def overlaps(left_start: datetime, left_end: datetime, right_start: datetime, right_end: datetime) -> bool:
    return left_start < right_end and right_start < left_end


def solve_schedule(request: ScheduleRequest, time_limit_seconds: float = 10.0) -> ScheduleResult:
    """Place eligible interviews while preserving hard constraints and fixed bookings."""
    model = cp_model.CpModel()
    candidates = {candidate.id: candidate for candidate in request.candidates}
    slots = {slot.id: slot for slot in request.slots}
    interviewers = {person.id: person for person in request.interviewers}
    rooms = {room.id: room for room in request.rooms}
    demands = request.interviews

    candidate_vars: dict[tuple[int, str], cp_model.IntVar] = {}
    assigned_vars: dict[int, cp_model.IntVar] = {}
    interviewer_vars: dict[tuple[int, str, str], cp_model.IntVar] = {}
    room_vars: dict[tuple[int, str, str], cp_model.IntVar] = {}
    unassigned_vars: dict[int, cp_model.IntVar] = {}
    objective_terms: list[cp_model.LinearExpr] = []

    def blocked_by_fixed(candidate_id: str, slot: TimeSlot, person_id: str | None = None, room_id: str | None = None) -> bool:
        for fixed in request.fixed_assignments:
            if not overlaps(slot.starts_at, slot.ends_at, fixed.starts_at, fixed.ends_at):
                continue
            if fixed.candidate_id == candidate_id:
                return True
            if person_id is not None and person_id in fixed.interviewer_ids:
                return True
            if room_id is not None and room_id == fixed.room_id:
                return True
        return False

    demand_by_candidate: dict[str, list[int]] = {}
    for index, demand in enumerate(demands):
        demand_by_candidate.setdefault(demand.candidate_id, []).append(index)
        candidate = candidates[demand.candidate_id]
        previous_round = ROUND_ORDER[demand.round] - 1
        previous_is_ready = previous_round < 0 or any(
            ROUND_ORDER[completed] == previous_round
            for completed in candidate.completed_rounds
            if completed in ROUND_ORDER
        )
        previous_is_scheduled = any(
            item.candidate_id == demand.candidate_id
            and ROUND_ORDER[item.round] == previous_round
            for item in demands
        )
        eligible = (
            demand.round in candidate.eligible_rounds
            and (previous_is_ready or previous_is_scheduled)
        )
        choices: list[cp_model.IntVar] = []
        if eligible:
            for slot_id in candidate.available_slot_ids:
                slot = slots.get(slot_id)
                if slot is None:
                    continue
                if blocked_by_fixed(demand.candidate_id, slot):
                    continue
                slot_minutes = int((slot.ends_at - slot.starts_at).total_seconds() // 60)
                if slot_minutes < demand.duration_minutes:
                    continue
                assignment = model.NewBoolVar(f"assign_{index}_{slot_id}")
                candidate_vars[(index, slot_id)] = assignment
                choices.append(assignment)

                capable_interviewers = [
                    person for person in request.interviewers
                    if demand.required_skills.issubset(person.skills)
                    and slot_id in person.available_slot_ids
                    and not blocked_by_fixed(demand.candidate_id, slot, person_id=person.id)
                ]
                for person in capable_interviewers:
                    person_assignment = model.NewBoolVar(f"person_{index}_{slot_id}_{person.id}")
                    interviewer_vars[(index, slot_id, person.id)] = person_assignment
                    model.Add(person_assignment <= assignment)
                model.Add(
                    sum(interviewer_vars[(index, slot_id, person.id)] for person in capable_interviewers)
                    == demand.panel_size * assignment
                )

                capable_rooms = [
                    room for room in request.rooms
                    if room.capacity >= demand.panel_size + 1
                    and slot_id in room.available_slot_ids
                    and not blocked_by_fixed(demand.candidate_id, slot, room_id=room.id)
                ]
                for room in capable_rooms:
                    room_assignment = model.NewBoolVar(f"room_{index}_{slot_id}_{room.id}")
                    room_vars[(index, slot_id, room.id)] = room_assignment
                    model.Add(room_assignment <= assignment)
                model.Add(
                    sum(room_vars[(index, slot_id, room.id)] for room in capable_rooms)
                    == assignment
                )

                afternoon_minutes = max(0, slot.starts_at.hour * 60 + slot.starts_at.minute - 12 * 60)
                objective_terms.append(assignment * (afternoon_minutes // 15))

        unassigned = model.NewBoolVar(f"unassigned_{index}")
        unassigned_vars[index] = unassigned
        assigned_vars[index] = unassigned.Not()
        model.Add(sum(choices) + unassigned == 1)
        objective_terms.append(unassigned * 100_000)

    candidate_resource_vars: dict[tuple[int, str, str], cp_model.IntVar] = {
        (demand_index, slot_id, demands[demand_index].candidate_id): variable
        for (demand_index, slot_id), variable in candidate_vars.items()
    }

    def add_resource_conflicts(
        resource_vars: dict[tuple[int, str, str], cp_model.IntVar],
    ) -> None:
        by_resource: dict[str, dict[str, list[cp_model.IntVar]]] = {}
        for (demand_index, slot_id, resource_id), variable in resource_vars.items():
            by_resource.setdefault(resource_id, {}).setdefault(slot_id, []).append(variable)
        for slots_by_id in by_resource.values():
            slot_ids = list(slots_by_id)
            for slot_id, variables in slots_by_id.items():
                if len(variables) > 1:
                    model.Add(sum(variables) <= 1)
            for first_id, second_id in combinations(slot_ids, 2):
                first_slot, second_slot = slots[first_id], slots[second_id]
                if overlaps(first_slot.starts_at, first_slot.ends_at, second_slot.starts_at, second_slot.ends_at):
                    model.Add(sum(slots_by_id[first_id]) + sum(slots_by_id[second_id]) <= 1)

    add_resource_conflicts(candidate_resource_vars)
    add_resource_conflicts(interviewer_vars)
    add_resource_conflicts(room_vars)

    for candidate_id, demand_indexes in demand_by_candidate.items():
        candidate = candidates[candidate_id]
        ordered_indexes = sorted(demand_indexes, key=lambda item: ROUND_ORDER[demands[item].round])
        for previous_index, current_index in zip(ordered_indexes, ordered_indexes[1:]):
            previous_demand = demands[previous_index]
            current_demand = demands[current_index]
            previous_round = ROUND_ORDER[previous_demand.round]
            if ROUND_ORDER[current_demand.round] != previous_round + 1:
                continue
            if previous_demand.round in candidate.completed_rounds:
                continue
            previous_start = model.NewIntVar(0, 40_000_000, f"start_{previous_index}")
            current_start = model.NewIntVar(0, 40_000_000, f"start_{current_index}")
            model.Add(previous_start == sum(
                int(slots[slot_id].starts_at.timestamp() // 60) * variable
                for (demand_index, slot_id), variable in candidate_vars.items()
                if demand_index == previous_index
            ))
            model.Add(current_start == sum(
                int(slots[slot_id].starts_at.timestamp() // 60) * variable
                for (demand_index, slot_id), variable in candidate_vars.items()
                if demand_index == current_index
            ))
            model.Add(
                current_start >= previous_start + previous_demand.duration_minutes
            ).OnlyEnforceIf([assigned_vars[previous_index], assigned_vars[current_index]])

    consecutive_penalties: list[cp_model.IntVar] = []
    assignments_by_interviewer: dict[str, dict[str, list[cp_model.IntVar]]] = {}
    for (demand_index, slot_id, person_id), variable in interviewer_vars.items():
        assignments_by_interviewer.setdefault(person_id, {}).setdefault(slot_id, []).append(variable)
    for person_id, slots_by_id in assignments_by_interviewer.items():
        used_by_slot: dict[str, cp_model.IntVar] = {}
        for slot_id, variables in slots_by_id.items():
            used = model.NewBoolVar(f"used_{person_id}_{slot_id}")
            model.Add(sum(variables) >= used)
            model.Add(sum(variables) <= len(variables) * used)
            used_by_slot[slot_id] = used
        for first_id, second_id in combinations(slots_by_id, 2):
            first_slot, second_slot = slots[first_id], slots[second_id]
            if first_slot.ends_at <= second_slot.starts_at:
                gap = second_slot.starts_at - first_slot.ends_at
                left_var, right_var = used_by_slot[first_id], used_by_slot[second_id]
            elif second_slot.ends_at <= first_slot.starts_at:
                gap = first_slot.starts_at - second_slot.ends_at
                left_var, right_var = used_by_slot[second_id], used_by_slot[first_id]
            else:
                continue
            if gap.total_seconds() > 15 * 60:
                continue
            consecutive = model.NewBoolVar(f"back_to_back_{len(consecutive_penalties)}")
            model.AddBoolAnd([left_var, right_var]).OnlyEnforceIf(consecutive)
            model.AddBoolOr([left_var.Not(), right_var.Not(), consecutive])
            consecutive_penalties.append(consecutive)
            objective_terms.append(consecutive * 25)

    if objective_terms:
        model.Minimize(sum(objective_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    solver.parameters.num_search_workers = 8
    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        raise RuntimeError(f"CP-SAT could not produce a schedule (status={solver.StatusName(status)})")

    assignments: list[ScheduledInterview] = []
    unscheduled: list[str] = []
    for index, demand in enumerate(demands):
        if solver.Value(unassigned_vars[index]):
            unscheduled.append(demand.id)
            continue
        selected_slot_id = next(
            slot_id for (demand_index, slot_id), variable in candidate_vars.items()
            if demand_index == index and solver.Value(variable)
        )
        selected_room_id = next(
            room_id for (demand_index, slot_id, room_id), variable in room_vars.items()
            if demand_index == index and slot_id == selected_slot_id and solver.Value(variable)
        )
        selected_interviewers = [
            person_id for (demand_index, slot_id, person_id), variable in interviewer_vars.items()
            if demand_index == index and slot_id == selected_slot_id and solver.Value(variable)
        ]
        slot = slots[selected_slot_id]
        assignments.append(ScheduledInterview(
            interview_id=demand.id,
            candidate_id=demand.candidate_id,
            round=demand.round,
            slot_id=selected_slot_id,
            starts_at=slot.starts_at,
            ends_at=slot.starts_at + timedelta(minutes=demand.duration_minutes),
            room_id=selected_room_id,
            interviewer_ids=selected_interviewers,
        ))

    return ScheduleResult(
        status=solver.StatusName(status),
        assignments=assignments,
        unscheduled_interview_ids=unscheduled,
        objective_value=int(solver.ObjectiveValue()),
        moved_candidate_count=0,
    )


def recover_after_cancellation(
    request: ScheduleRequest,
    cancelled_interviewer_id: str,
    existing_assignments: list[ScheduledInterview],
    time_limit_seconds: float = 10.0,
) -> ScheduleResult:
    """Rebuild only interviews assigned to the unavailable interviewer."""
    affected_ids = {
        assignment.interview_id
        for assignment in existing_assignments
        if cancelled_interviewer_id in assignment.interviewer_ids
    }
    affected_demands = [item for item in request.interviews if item.id in affected_ids]
    unaffected = [item for item in existing_assignments if item.interview_id not in affected_ids]
    if not affected_demands:
        return ScheduleResult(
            status="NO_CHANGE",
            assignments=unaffected,
            unscheduled_interview_ids=[],
            objective_value=0,
            moved_candidate_count=0,
        )

    moved_fixed = [
        FixedAssignment(
            candidate_id=item.candidate_id,
            starts_at=item.starts_at,
            ends_at=item.ends_at,
            interviewer_ids=item.interviewer_ids,
            room_id=item.room_id,
        )
        for item in unaffected
    ]
    recovery_request = request.model_copy(update={
        "interviews": affected_demands,
        "fixed_assignments": [*request.fixed_assignments, *moved_fixed],
        "interviewers": [person for person in request.interviewers if person.id != cancelled_interviewer_id],
    })
    recovered = solve_schedule(recovery_request, time_limit_seconds)
    return ScheduleResult(
        status=recovered.status,
        assignments=[*unaffected, *recovered.assignments],
        unscheduled_interview_ids=recovered.unscheduled_interview_ids,
        objective_value=recovered.objective_value,
        moved_candidate_count=len({
            old.candidate_id
            for old in existing_assignments
            if old.interview_id in affected_ids
            and any(new.interview_id == old.interview_id and new.slot_id != old.slot_id for new in recovered.assignments)
        }),
    )
