import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register (Create new account with cascading data)
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'candidate',
      appliedRole,
      title,
      department,
      organization,
      phone,
      skills,
      maxInterviewsPerDay
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['coordinator', 'interviewer', 'candidate'].includes(role) ? role : 'candidate';

    // 1. Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email address already exists. Please sign in.' });
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Generate initials & avatar metadata
    const nameParts = name.trim().split(/\s+/);
    const initials = nameParts.length > 1
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    const avatarBg = cleanRole === 'coordinator'
      ? 'bg-indigo-600'
      : cleanRole === 'interviewer'
      ? 'bg-violet-600'
      : 'bg-emerald-600';

    const roleTitle = cleanRole === 'coordinator'
      ? 'Placement Coordinator'
      : cleanRole === 'interviewer'
      ? (title || 'Technical Panel Evaluator')
      : `Candidate — ${appliedRole || 'Software Development Engineer'}`;

    const userId = `usr-${cleanRole.slice(0, 4)}-${Date.now().toString(36)}`;

    // 4. Insert into users table
    await pool.query(
      `INSERT INTO users (id, name, email, password_hash, role, role_title, avatar, avatar_bg, department, organization)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        userId,
        name.trim(),
        cleanEmail,
        passwordHash,
        cleanRole,
        roleTitle,
        initials,
        avatarBg,
        department || (cleanRole === 'candidate' ? 'Computer Science & Engineering' : 'Engineering'),
        organization || (cleanRole === 'candidate' ? 'Webster University' : 'ArcLight')
      ]
    );

    // 5. Cascade data into domain tables
    if (cleanRole === 'candidate') {
      const candId = `cand-${Date.now().toString(36)}`;
      const parsedSkills = Array.isArray(skills)
        ? skills
        : (typeof skills === 'string' && skills.trim()
            ? skills.split(',').map(s => s.trim()).filter(Boolean)
            : ['Algorithms', 'Data Structures', 'JavaScript', 'React']);

      await pool.query(
        `INSERT INTO candidates (id, name, email, phone, applied_role, drive_id, skills, current_round, stage, status, score, avatar_bg, initials, applied_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_DATE, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          candId,
          name.trim(),
          cleanEmail,
          phone || '',
          appliedRole || 'Software Development Engineer',
          'drv-101',
          JSON.stringify(parsedSkills),
          'Technical Screen · R1',
          'Technical',
          'Scheduled',
          85,
          avatarBg,
          initials,
          'Self-registered candidate via ArcLight portal'
        ]
      ).catch(err => console.warn('Could not cascade candidate record:', err.message));
    } else if (cleanRole === 'interviewer') {
      const intId = `int-${Date.now().toString(36)}`;
      const parsedSkills = Array.isArray(skills)
        ? skills
        : (typeof skills === 'string' && skills.trim()
            ? skills.split(',').map(s => s.trim()).filter(Boolean)
            : ['System Architecture', 'Coding Challenge', 'Algorithmic Problem Solving']);

      const defaultWeekly = {
        Monday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        Wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
        Friday: ['09:00', '10:00', '11:00', '14:00', '15:00']
      };

      await pool.query(
        `INSERT INTO interviewers (id, name, email, title, department, skills, max_interviews_per_day, assigned_interviews, rating, status, avatar_bg, initials, availability_summary, weekly_availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (id) DO NOTHING`,
        [
          intId,
          name.trim(),
          cleanEmail,
          title || 'Technical Panel Evaluator',
          department || 'Engineering',
          JSON.stringify(parsedSkills),
          Number(maxInterviewsPerDay) || 3,
          0,
          5.0,
          'Available',
          avatarBg,
          initials,
          'Mon, Wed, Fri (09:00 - 16:00)',
          JSON.stringify(defaultWeekly)
        ]
      ).catch(err => console.warn('Could not cascade interviewer record:', err.message));
    }

    // 6. Sign JWT Token for instant login
    const token = jwt.sign(
      { id: userId, email: cleanEmail, role: cleanRole },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const safeUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      role: cleanRole,
      roleTitle,
      avatar: initials,
      avatarBg,
      department: department || (cleanRole === 'candidate' ? 'Computer Science & Engineering' : 'Engineering'),
      organization: organization || 'Webster University'
    };

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Look up user by email (supports apex dynamics and legacy alias)
    let lookupEmail = email.trim().toLowerCase();
    if (lookupEmail === 'priya.nair@northstar.io') {
      lookupEmail = 'priya.nair@apexdynamics.com';
    }
    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR (LOWER($1) = \'priya.nair@apexdynamics.com\' AND LOWER(email) = \'priya.nair@northstar.io\')', [lookupEmail]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = userRes.rows[0];

    // 2. Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Sign JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 4. Return user profile without password_hash
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleTitle: user.role_title,
      avatar: user.avatar,
      avatarBg: user.avatar_bg,
      department: user.department,
      organization: user.organization
    };

    res.json({
      success: true,
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/auth/me (Returns logged in user from token)
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      roleTitle: req.user.role_title,
      avatar: req.user.avatar,
      avatarBg: req.user.avatar_bg,
      department: req.user.department,
      organization: req.user.organization
    }
  });
});

export default router;
