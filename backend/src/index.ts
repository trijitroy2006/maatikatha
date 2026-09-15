// ============================================================
// MaatiKatha Backend — Main Entry Point
// Node.js + Express + TypeScript REST API
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { initDb } from './db';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRouter from './routes/auth';
import farmRouter from './routes/farm';
import simulatorRouter from './routes/simulator';
import climateRouter from './routes/climate';
import doctorRouter from './routes/doctor';
import mandiRouter from './routes/mandi';
import pestRouter from './routes/pest';
import uploadRouter from './routes/upload';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// ============================================================
// Security & Middleware
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Serve uploaded images statically
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth',      authRouter);
app.use('/api/farm',      farmRouter);
app.use('/api/simulator', simulatorRouter);
app.use('/api/climate',   climateRouter);
app.use('/api/doctor',    doctorRouter);
app.use('/api/mandi',     mandiRouter);
app.use('/api/pest',      pestRouter);
app.use('/api/upload',    uploadRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MaatiKatha API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API docs landing
app.get('/api', (req, res) => {
  res.json({
    name: 'MaatiKatha Agricultural Intelligence API',
    version: '2.0.0',
    endpoints: {
      auth:      'POST /api/auth/register, POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout, GET /api/auth/me',
      farm:      'GET|POST /api/farm/plots, GET|PUT|DELETE /api/farm/plots/:id, PUT /api/farm/location',
      simulator: 'POST /api/simulator, GET /api/simulator/history',
      climate:   'GET /api/climate?lat=&lon=',
      doctor:    'POST /api/doctor, GET /api/doctor/history',
      mandi:     'GET /api/mandi?crop=&harvestDate=',
      pest:      'GET /api/pest?lat=&lon=, GET /api/pest/all, POST /api/pest',
      upload:    'POST /api/upload, GET /api/upload/my',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================
initDb();
app.listen(PORT, () => {
  console.log('');
  console.log('🌾 ============================================');
  console.log('   MaatiKatha API Server Running');
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://localhost:${PORT}/health`);
  console.log(`   http://localhost:${PORT}/api`);
  console.log('   Environment:', process.env.NODE_ENV);
  console.log('🌾 ============================================');
  console.log('');
});

export default app;
