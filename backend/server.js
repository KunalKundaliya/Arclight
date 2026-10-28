import 'dotenv/config';
import authRoutes from './src/routes/authRoutes.js';
import express from 'express';
import cors from 'cors';
import { pool } from './src/config/db.js';



// Import route modules
import drivesRoutes from './src/routes/drivesRoutes.js';
import candidatesRoutes from './src/routes/candidatesRoutes.js';
import interviewersRoutes from './src/routes/interviewersRoutes.js';
import roomsRoutes from './src/routes/roomsRoutes.js';
import interviewsRoutes from './src/routes/interviewsRoutes.js';
import schedulerRoutes from './src/routes/schedulerRoutes.js';
import evaluationsRoutes from './src/routes/evaluationsRoutes.js';
import reportsRoutes from './src/routes/reportsRoutes.js';
import notificationsRoutes from './src/routes/notificationsRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'online',
      database: 'connected',
      dbTime: dbRes.rows[0].now,
      service: 'ArcLight Constraint Recruitment API',
      version: '1.0.0'
    });
  } catch (err) {
    res.status(500).json({
      status: 'degraded',
      database: 'disconnected',
      error: err.message
    });
  }
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drives', drivesRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/interviewers', interviewersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/interviews', interviewsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ArcLight Recruitment Backend API Server`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📡 Health Check:     http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

export default app;
