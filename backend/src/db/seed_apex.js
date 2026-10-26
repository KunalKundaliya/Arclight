import { pool } from '../config/db.js';

async function seedApex() {
  await pool.query(`
    INSERT INTO drives (id, name, company, role, start_date, end_date, candidates_count, rounds, status, description, target_hires, completed_interviews, total_scheduled)
    VALUES (
      'drv-105',
      'Apex Dynamics · Fall 2026',
      'Apex Dynamics',
      'Distributed Systems & Platform Architect',
      '2026-11-02',
      '2026-11-06',
      65,
      '["System Architecture", "Coding Challenge", "Leadership & Fit"]'::jsonb,
      'Active',
      'Flagship systems architecture and distributed consensus recruitment drive for Fall 2026.',
      15,
      0,
      0
    )
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      company = EXCLUDED.company,
      rounds = EXCLUDED.rounds;
  `);

  const apexCandidates = [
    {
      id: 'cand-apex-01',
      name: 'Vikram Singhania',
      email: 'vikram.singhania@webster.edu',
      phone: '+1 (555) 234-8910',
      appliedRole: 'Senior Distributed Architect',
      driveId: 'drv-105',
      skills: JSON.stringify(['System Design', 'Distributed Systems', 'Go', 'Consensus']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 96,
      avatarBg: 'bg-indigo-600',
      initials: 'VS'
    },
    {
      id: 'cand-apex-02',
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@webster.edu',
      phone: '+1 (555) 345-9012',
      appliedRole: 'Fault-Tolerant Platform Engineer',
      driveId: 'drv-105',
      skills: JSON.stringify(['C++', 'Concurrency', 'Network Protocols', 'Kubernetes']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 94,
      avatarBg: 'bg-violet-600',
      initials: 'AD'
    },
    {
      id: 'cand-apex-03',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.mansoor@webster.edu',
      phone: '+1 (555) 456-0123',
      appliedRole: 'High-Throughput Storage Engineer',
      driveId: 'drv-105',
      skills: JSON.stringify(['Distributed Systems', 'LSM Trees', 'Rust', 'Linux']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 93,
      avatarBg: 'bg-emerald-600',
      initials: 'TA'
    },
    {
      id: 'cand-apex-04',
      name: 'Elena Rostova',
      email: 'elena.rostova@webster.edu',
      phone: '+1 (555) 567-1234',
      appliedRole: 'Cloud Infrastructure Architect',
      driveId: 'drv-105',
      skills: JSON.stringify(['Cloud Infrastructure', 'System Design', 'Go', 'Docker']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 91,
      avatarBg: 'bg-cyan-600',
      initials: 'ER'
    },
    {
      id: 'cand-apex-05',
      name: 'Marcus Vance',
      email: 'marcus.vance@webster.edu',
      phone: '+1 (555) 678-2345',
      appliedRole: 'Platform Resilience Lead',
      driveId: 'drv-105',
      skills: JSON.stringify(['System Design', 'Chaos Engineering', 'Java', 'Distributed Systems']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 95,
      avatarBg: 'bg-purple-600',
      initials: 'MV'
    },
    {
      id: 'cand-apex-06',
      name: 'Zoya Akhtar',
      email: 'zoya.akhtar@webster.edu',
      phone: '+1 (555) 789-3456',
      appliedRole: 'Distributed Consensus Specialist',
      driveId: 'drv-105',
      skills: JSON.stringify(['Raft', 'Paxos', 'Distributed Systems', 'C++']),
      currentRound: 'System Architecture',
      stage: 'Technical',
      status: 'Active',
      score: 97,
      avatarBg: 'bg-pink-600',
      initials: 'ZA'
    }
  ];

  for (const c of apexCandidates) {
    await pool.query(`
      INSERT INTO candidates (id, name, email, phone, applied_role, drive_id, skills, current_round, stage, status, score, avatar_bg, initials)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        applied_role = EXCLUDED.applied_role,
        skills = EXCLUDED.skills,
        current_round = EXCLUDED.current_round;
    `, [c.id, c.name, c.email, c.phone, c.appliedRole, c.driveId, c.skills, c.currentRound, c.stage, c.status, c.score, c.avatarBg, c.initials]);
  }

  console.log('✅ Apex Dynamics · Fall 2026 drive & candidates seeded successfully');
  await pool.end();
}

seedApex().catch(err => {
  console.error('Error seeding Apex drive:', err);
  process.exit(1);
});
