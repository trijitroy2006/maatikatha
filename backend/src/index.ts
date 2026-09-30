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
import authRouter         from './routes/auth';
import farmRouter         from './routes/farm';
import simulatorRouter    from './routes/simulator';
import climateRouter      from './routes/climate';
import doctorRouter       from './routes/doctor';
import mandiRouter        from './routes/mandi';
import pestRouter         from './routes/pest';
import uploadRouter       from './routes/upload';
// Phase II routes
import chitrodrishtiRouter from './routes/chitrodrishti';
import shorrakhokRouter    from './routes/shorrakhok';
import maatisurakshaRouter from './routes/maatisuraksha';
import compostRouter       from './routes/compost';

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
app.use('/api/auth',          authRouter);
app.use('/api/farm',          farmRouter);
app.use('/api/simulator',     simulatorRouter);
app.use('/api/climate',       climateRouter);
app.use('/api/doctor',        doctorRouter);
app.use('/api/mandi',         mandiRouter);
app.use('/api/pest',          pestRouter);
app.use('/api/upload',        uploadRouter);
// Phase II
app.use('/api/chitrodrishti', chitrodrishtiRouter);
app.use('/api/shorrakhok',    shorrakhokRouter);
app.use('/api/score',         maatisurakshaRouter);
app.use('/api/compost',       compostRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MaatiKatha API',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    phase_ii: ['chitrodrishti', 'shorrakhok', 'maatisuraksha', 'compost'],
  });
});

// API docs landing
app.get('/api', (req, res) => {
  res.json({
    name: 'MaatiKatha Agricultural Intelligence API',
    version: '3.0.0 (Phase II)',
    phase_i: {
      auth:      'POST /api/auth/register, POST /api/auth/login',
      farm:      'GET|POST /api/farm/plots',
      simulator: 'POST /api/simulator',
      climate:   'GET /api/climate?lat=&lon=',
      doctor:    'POST /api/doctor',
      mandi:     'GET /api/mandi?crop=',
      pest:      'GET /api/pest?lat=&lon=',
      upload:    'POST /api/upload',
    },
    phase_ii: {
      chitrodrishti: 'POST /api/chitrodrishti/diagnose — AI Visual Crop Disease Triage',
      shorrakhok:    'POST /api/shorrakhok/scan — Acoustic Pest FFT Radar',
      maatisuraksha: 'GET /api/score/:farmId — Micro-Insurance Resilience Score',
      compost:       'POST /api/compost — Biomass Composting Timeline, GET /api/compost/crops',
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
