export const initialNotifications = [
  {
    id: 'notif-01',
    title: 'Scheduling Conflict Alert',
    message: 'Double-booking detected for Dr. Evelyn Voss on Oct 22 at 10:00 AM between Soren Vance and Tariq Al-Mansoor.',
    type: 'conflict',
    timestamp: '12 minutes ago',
    date: '2026-10-21 19:45',
    isRead: false,
    link: '/coordinator/scheduler'
  },
  {
    id: 'notif-02',
    title: 'Candidate Self-Booked Slot',
    message: 'Soren Vance confirmed attendance for System Architecture round on Oct 22, 10:00 AM.',
    type: 'booking',
    timestamp: '45 minutes ago',
    date: '2026-10-21 19:10',
    isRead: false,
    link: '/coordinator/calendar'
  },
  {
    id: 'notif-03',
    title: 'Evaluation Submitted',
    message: 'Devon Thorne completed evaluation for Zane Gallagher. Result: Score 64 (No Hire).',
    type: 'evaluation',
    timestamp: '2 hours ago',
    date: '2026-10-21 17:50',
    isRead: true,
    link: '/coordinator/evaluations'
  },
  {
    id: 'notif-04',
    title: 'Batch Schedule Solver Finished',
    message: 'Deterministic constraint scheduler resolved 14 slots for Apex Dynamics · Fall 2026.',
    type: 'schedule',
    timestamp: '4 hours ago',
    date: '2026-10-21 15:30',
    isRead: true,
    link: '/coordinator/scheduler'
  },
  {
    id: 'notif-05',
    title: 'Pending Evaluation Reminder',
    message: 'Elena Rostova interview is concluding. Marcus Sterling and Maya Lin-Kowalski rubric scores pending.',
    type: 'reminder',
    timestamp: '5 hours ago',
    date: '2026-10-21 14:40',
    isRead: false,
    link: '/coordinator/evaluations'
  },
  {
    id: 'notif-06',
    title: 'Room Maintenance Schedule',
    message: 'Executive Boardroom 801 is scheduled for firmware upgrades today from 16:00 to 17:00.',
    type: 'system',
    timestamp: '1 day ago',
    date: '2026-10-20 09:00',
    isRead: true,
    link: '/coordinator/rooms'
  }
];
