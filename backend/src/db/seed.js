import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { initialDrives } from '../data/mockDrives.js';
import { initialCandidates } from '../data/mockCandidates.js';
import { initialInterviewers } from '../data/mockInterviewers.js';
import { initialRooms } from '../data/mockRooms.js';
import { initialInterviews } from '../data/mockInterviews.js';
import { initialEvaluations } from '../data/mockEvaluations.js';
import { initialNotifications } from '../data/mockNotifications.js';

async function seed() {
  console.log('🌱 Starting database setup and seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔨 Dropping old tables and recreating schema...');
    await client.query(`
      DROP TABLE IF EXISTS users, evaluations, interviews, candidates, rooms, interviewers, drives, notifications CASCADE;

      -- 1. Users Table (Authentication & Role Authorization)
      CREATE TABLE users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        role_title VARCHAR(255),
        avatar VARCHAR(10),
        avatar_bg VARCHAR(50) DEFAULT 'bg-indigo-600',
        department VARCHAR(255),
        organization VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Drives Table
      CREATE TABLE drives (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        role VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        candidates_count INT DEFAULT 0,
        rounds JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Active',
        description TEXT,
        target_hires INT DEFAULT 0,
        completed_interviews INT DEFAULT 0,
        total_scheduled INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Interviewers Table
      CREATE TABLE interviewers (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        title VARCHAR(255),
        department VARCHAR(255),
        skills JSONB DEFAULT '[]'::jsonb,
        max_interviews_per_day INT DEFAULT 3,
        assigned_interviews INT DEFAULT 0,
        rating NUMERIC(3, 2) DEFAULT 5.0,
        status VARCHAR(50) DEFAULT 'Available',
        avatar_bg VARCHAR(50) DEFAULT 'bg-indigo-600',
        initials VARCHAR(10),
        availability_summary TEXT,
        weekly_availability JSONB DEFAULT '{}'::jsonb
      );

      -- 4. Rooms Table
      CREATE TABLE rooms (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        capacity INT DEFAULT 4,
        type VARCHAR(50) DEFAULT 'Physical Pod',
        equipment JSONB DEFAULT '[]'::jsonb,
        status VARCHAR(50) DEFAULT 'Available',
        features JSONB DEFAULT '[]'::jsonb,
        current_status_note TEXT
      );

      -- 5. Candidates Table
      CREATE TABLE candidates (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        applied_role VARCHAR(255),
        drive_id VARCHAR(64),
        skills JSONB DEFAULT '[]'::jsonb,
        current_round VARCHAR(255),
        stage VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Active',
        score INT DEFAULT 0,
        avatar_bg VARCHAR(50) DEFAULT 'bg-indigo-600',
        initials VARCHAR(10),
        applied_date DATE DEFAULT CURRENT_DATE,
        room VARCHAR(100),
        interviewer VARCHAR(255),
        scheduled_time VARCHAR(100),
        notes TEXT
      );

      -- 6. Interviews Table
      CREATE TABLE interviews (
        id VARCHAR(64) PRIMARY KEY,
        candidate_id VARCHAR(64),
        candidate_name VARCHAR(255),
        candidate_email VARCHAR(255),
        candidate_role VARCHAR(255),
        drive_id VARCHAR(64),
        interviewer_ids JSONB DEFAULT '[]'::jsonb,
        interviewer_names JSONB DEFAULT '[]'::jsonb,
        room_id VARCHAR(64),
        room_name VARCHAR(255),
        round_type VARCHAR(100),
        round_title VARCHAR(255),
        date DATE,
        day_name VARCHAR(50),
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        duration VARCHAR(50) DEFAULT '45 min',
        status VARCHAR(50) DEFAULT 'Scheduled',
        evaluation_status VARCHAR(50) DEFAULT 'Pending',
        meeting_url TEXT,
        score INT,
        badge_text VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Evaluations Table
      CREATE TABLE evaluations (
        id VARCHAR(64) PRIMARY KEY,
        interview_id VARCHAR(64),
        candidate_id VARCHAR(64),
        candidate_name VARCHAR(255),
        role VARCHAR(255),
        round VARCHAR(255),
        interviewer_name VARCHAR(255),
        interviewer_id VARCHAR(64),
        status VARCHAR(50) DEFAULT 'Completed',
        total_score INT,
        recommendation VARCHAR(50),
        rubric JSONB DEFAULT '{}'::jsonb,
        strengths TEXT,
        growth_areas TEXT,
        summary TEXT,
        submitted_date DATE DEFAULT CURRENT_DATE
      );

      -- 8. Notifications Table
      CREATE TABLE notifications (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        time VARCHAR(100),
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 1. Seed Drives
    console.log('📦 Seeding drives...');
    for (const d of initialDrives) {
      await client.query(
        `INSERT INTO drives (id, name, company, role, start_date, end_date, candidates_count, rounds, status, description, target_hires, completed_interviews, total_scheduled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.name, d.company, d.role, d.startDate, d.endDate, d.candidatesCount, JSON.stringify(d.rounds), d.status, d.description, d.targetHires, d.completedInterviews, d.totalScheduled]
      );
    }

    // 2. Seed Interviewers
    console.log('👥 Seeding interviewers...');
    for (const i of initialInterviewers) {
      await client.query(
        `INSERT INTO interviewers (id, name, email, title, department, skills, max_interviews_per_day, assigned_interviews, rating, status, avatar_bg, initials, availability_summary, weekly_availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [i.id, i.name, i.email, i.title, i.department, JSON.stringify(i.skills), i.maxInterviewsPerDay, i.assignedInterviews, i.rating, i.status, i.avatarBg, i.initials, i.availabilitySummary, JSON.stringify(i.weeklyAvailability)]
      );
    }

    // 3. Seed Rooms
    console.log('🏢 Seeding rooms...');
    for (const r of initialRooms) {
      await client.query(
        `INSERT INTO rooms (id, name, location, capacity, type, equipment, status, features, current_status_note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [r.id, r.name, r.location, r.capacity, r.type, JSON.stringify(r.equipment), r.status, JSON.stringify(r.features), r.currentStatusNote]
      );
    }

    // 4. Seed Candidates
    console.log('🎓 Seeding candidates...');
    for (const c of initialCandidates) {
      await client.query(
        `INSERT INTO candidates (id, name, email, phone, applied_role, drive_id, skills, current_round, stage, status, score, avatar_bg, initials, applied_date, room, interviewer, scheduled_time, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.email, c.phone, c.appliedRole, c.driveId, JSON.stringify(c.skills), c.currentRound, c.stage, c.status, c.score, c.avatarBg, c.initials, c.appliedDate, c.room, c.interviewer, c.scheduledTime, c.notes]
      );
    }

    // 5. Seed Interviews
    console.log('📅 Seeding interviews...');
    for (const it of initialInterviews) {
      await client.query(
        `INSERT INTO interviews (id, candidate_id, candidate_name, candidate_email, candidate_role, drive_id, interviewer_ids, interviewer_names, room_id, room_name, round_type, round_title, date, day_name, start_time, end_time, duration, status, evaluation_status, meeting_url, score, badge_text, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
         ON CONFLICT (id) DO NOTHING`,
        [it.id, it.candidateId, it.candidateName, it.candidateEmail, it.candidateRole, it.driveId, JSON.stringify(it.interviewerIds), JSON.stringify(it.interviewerNames), it.roomId, it.roomName, it.roundType, it.roundTitle, it.date, it.dayName, it.startTime, it.endTime, it.duration, it.status, it.evaluationStatus, it.meetingUrl, it.score, it.badgeText, it.notes]
      );
    }

    // 6. Seed Evaluations
    console.log('📝 Seeding evaluations...');
    for (const ev of initialEvaluations) {
      await client.query(
        `INSERT INTO evaluations (id, interview_id, candidate_id, candidate_name, role, round, interviewer_name, interviewer_id, status, total_score, recommendation, rubric, strengths, growth_areas, summary, submitted_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         ON CONFLICT (id) DO NOTHING`,
        [ev.id, ev.interviewId, ev.candidateId, ev.candidateName, ev.role, ev.round, ev.interviewerName, ev.interviewerId, ev.status, ev.totalScore, ev.recommendation, JSON.stringify(ev.rubric), ev.strengths, ev.growthAreas, ev.summary, ev.submittedDate]
      );
    }

    // 7. Seed Notifications
    console.log('🔔 Seeding notifications...');
    for (const n of initialNotifications) {
      await client.query(
        `INSERT INTO notifications (id, title, description, time, type, read)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [n.id, n.title, n.description, n.time, n.type, n.read || false]
      );
    }

    // 8. Seed Default Users with Hashed Passwords
    console.log('👤 Seeding user accounts...');
    const defaultPasswordHash = bcrypt.hashSync('password123', 10);
    const defaultUsers = [
      {
        id: 'user-coord',
        name: 'Maya Chen',
        email: 'maya.chen@arclight.io',
        role: 'coordinator',
        roleTitle: 'Placement Coordinator',
        avatar: 'MC',
        avatarBg: 'bg-indigo-600',
        department: 'Campus Placement Cell',
        organization: 'ArcLight'
      },
      {
        id: 'user-int-01',
        name: 'Priya Nair',
        email: 'priya.nair@northstar.io',
        role: 'interviewer',
        roleTitle: 'Senior Engineering Panel Lead',
        avatar: 'PN',
        avatarBg: 'bg-violet-600',
        department: 'Northstar Labs Engineering',
        organization: 'Northstar Labs'
      },
      {
        id: 'user-cand-01',
        name: 'Aanya Shah',
        email: 'aanya.shah@webster.edu',
        role: 'candidate',
        roleTitle: 'Candidate — Software Engineering',
        avatar: 'AS',
        avatarBg: 'bg-emerald-600',
        department: 'Computer Science & Engineering',
        organization: 'Webster University'
      }
    ];

    for (const u of defaultUsers) {
      await client.query(
        `INSERT INTO users (id, name, email, password_hash, role, role_title, avatar, avatar_bg, department, organization)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
        [u.id, u.name, u.email, defaultPasswordHash, u.role, u.roleTitle, u.avatar, u.avatarBg, u.department, u.organization]
      );
    }

    await client.query('COMMIT');
    console.log('🎉 All tables created and database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    process.exit();
  }
}

seed();
