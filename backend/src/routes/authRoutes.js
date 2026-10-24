import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 1. Look up user by email
    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
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
