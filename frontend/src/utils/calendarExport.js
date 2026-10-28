/**
 * ArcLight - Calendar Export Engine
 * Generates RFC 5545 .ics iCalendar format files and Google Calendar web deep-links.
 */

// Helper to format ISO Date + Time ('2026-10-26', '14:00') into '20261026T140000'
function formatIcsDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '';
  const cleanDate = dateStr.replace(/-/g, '');
  const cleanTime = timeStr.replace(/:/g, '').padEnd(4, '0') + '00';
  return `${cleanDate}T${cleanTime}`;
}

export function generateIcsContent(interview) {
  const dtStart = formatIcsDateTime(interview.date, interview.startTime);
  const dtEnd = formatIcsDateTime(interview.date, interview.endTime || interview.startTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const summary = `${interview.roundTitle || 'Technical Interview'} — ArcLight`;
  const description = [
    `Candidate: ${interview.candidateName || 'Candidate'}`,
    `Round: ${interview.roundTitle || 'Technical'}`,
    `Interviewer(s): ${(interview.interviewerNames || []).join(', ') || 'Assigned Faculty'}`,
    `Chamber / Room: ${interview.roomName || 'Virtual Chamber'}`,
    `Meeting URL: ${interview.meetingUrl || 'https://meet.arclight.io'}`,
    `Notes: ${interview.notes || 'Automated via ArcLight CSP Engine'}`
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
    `LOCATION:${interview.roomName || 'Virtual Cloud Chamber'}`,
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
  const dtStart = formatIcsDateTime(interview.date, interview.startTime);
  const dtEnd = formatIcsDateTime(interview.date, interview.endTime || interview.startTime);

  const text = encodeURIComponent(`${interview.roundTitle || 'Technical Interview'} — ArcLight`);
  const faculty = (interview.interviewerNames || []).join(', ');
  const details = encodeURIComponent(
    `Candidate: ${interview.candidateName || 'Candidate'}\nChamber: ${interview.roomName || 'Virtual Chamber'}\nFaculty: ${faculty}\nLink: ${interview.meetingUrl || 'https://meet.arclight.io'}`
  );
  const location = encodeURIComponent(interview.roomName || 'Virtual Cloud Chamber');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dtStart}/${dtEnd}&details=${details}&location=${location}`;
}
