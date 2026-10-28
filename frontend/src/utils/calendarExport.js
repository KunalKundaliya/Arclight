/**
 * ArcLight - Calendar Export Engine
 * Generates RFC 5545 .ics iCalendar format files and Google Calendar web deep-links.
 */

// Helper to calculate default end time if not explicitly provided
function calculateDefaultEndTime(timeStr, durationMinutes = 45) {
  if (!timeStr) return '10:45';
  const parts = timeStr.split(':').map(Number);
  const totalMins = (parts[0] || 9) * 60 + (parts[1] || 0) + durationMinutes;
  const endH = String(Math.floor(totalMins / 60) % 24).padStart(2, '0');
  const endM = String(totalMins % 60).padStart(2, '0');
  return `${endH}:${endM}`;
}

// Helper to format ISO Date + Time ('2026-10-26', '14:00') into '20261026T140000'
function formatIcsDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const cleanDate = dateStr.replace(/[^0-9]/g, '');
  const cleanTime = timeStr.replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4) + '00';
  return `${cleanDate}T${cleanTime}`;
}

export function generateIcsContent(interview) {
  const endTime = interview.endTime && interview.endTime !== interview.startTime
    ? interview.endTime
    : calculateDefaultEndTime(interview.startTime, 45);

  const dtStart = formatIcsDateTime(interview.date || '2026-11-04', interview.startTime || '09:00');
  const dtEnd = formatIcsDateTime(interview.date || '2026-11-04', endTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `${interview.roundTitle || 'Technical Interview'} — ArcLight`;
  const description = [
    `Candidate: ${interview.candidateName || 'Candidate'}`,
    `Round: ${interview.roundTitle || 'Technical'}`,
    `Interviewer(s): ${(interview.interviewerNames || []).join(', ') || 'Assigned Faculty'}`,
    `Room: ${interview.roomName || 'Virtual Room'}`,
    `Meeting URL: ${interview.meetingUrl || 'https://meet.arclight.io'}`,
    `Notes: ${interview.notes || 'Automated via ArcLight Scheduler'}`
  ].join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ArcLight//Recruitment Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:arclight-${interview.id || Date.now()}@arclight.io`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${interview.roomName || 'Virtual Meeting Room'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadIcsFile(interview) {
  const icsData = generateIcsContent(interview);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (interview.candidateName || 'session').replace(/\s+/g, '_');
  link.download = `interview-${safeName}-${interview.date || 'calendar'}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getGoogleCalendarUrl(interview) {
  const endTime = interview.endTime && interview.endTime !== interview.startTime
    ? interview.endTime
    : calculateDefaultEndTime(interview.startTime, 45);

  const dtStart = formatIcsDateTime(interview.date || '2026-11-04', interview.startTime || '09:00');
  const dtEnd = formatIcsDateTime(interview.date || '2026-11-04', endTime);

  const text = encodeURIComponent(`${interview.roundTitle || 'Technical Interview'} — ArcLight`);
  const faculty = (interview.interviewerNames || []).join(', ');
  const details = encodeURIComponent(
    `Candidate: ${interview.candidateName || 'Candidate'}\nRoom: ${interview.roomName || 'Virtual Room'}\nFaculty: ${faculty || 'Evaluation Panel'}\nLink: ${interview.meetingUrl || 'https://meet.arclight.io'}`
  );
  const location = encodeURIComponent(interview.roomName || 'Virtual Meeting Room');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}`;
}
