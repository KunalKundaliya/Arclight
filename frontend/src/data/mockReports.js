export const mockOverviewChartData = [
  { date: 'Mon 02', scheduled: 48, completed: 48, conflicts: 0 },
  { date: 'Tue 03', scheduled: 52, completed: 50, conflicts: 1 },
  { date: 'Wed 04', scheduled: 56, completed: 52, conflicts: 2 },
  { date: 'Thu 05', scheduled: 42, completed: 38, conflicts: 0 },
  { date: 'Fri 06', scheduled: 30, completed: 25, conflicts: 0 },
];

export const mockInterviewerUtilization = [
  { name: 'Priya Nair', assigned: 18, capacity: 20, utilization: 90 },
  { name: 'Devon Thorne', assigned: 14, capacity: 16, utilization: 87 },
  { name: 'Aria Chen', assigned: 16, capacity: 18, utilization: 88 },
  { name: 'Marcus Sterling', assigned: 10, capacity: 12, utilization: 83 },
  { name: 'Maya L.K.', assigned: 12, capacity: 15, utilization: 80 },
];

export const mockRoundFunnel = [
  { stage: 'Technical screen · R1', candidates: 240, passed: 182, dropRate: '24%' },
  { stage: 'System Architecture · R2', candidates: 182, passed: 94, dropRate: '48%' },
  { stage: 'Executive Bar Raiser · R3', candidates: 94, passed: 42, dropRate: '55%' },
  { stage: 'Final Offers Extended', candidates: 42, passed: 35, dropRate: '16%' },
];

export const mockRoundDistribution = [
  { name: 'Technical Screens', value: 120, color: '#4f46e5' },
  { name: 'System Architecture', value: 68, color: '#06b6d4' },
  { name: 'Leadership & Fit', value: 40, color: '#8b5cf6' },
];

export const mockKpis = {
  activeDrives: 4,
  activeDrivesNote: '2 opening this week',
  candidatesInApex: 240,
  candidatesInNorthstar: 240,
  candidatesScheduledNote: '228 scheduled · 95% coverage',
  interviewsThisWeek: 228,
  interviewsPanelsNote: 'Across 8 panels · 6 rooms',
  needsAttention: 3,
  needsAttentionNote: '2 conflicts · 1 dropout request',
};
