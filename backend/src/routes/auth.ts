import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../db';
import type { UserRecord, RefreshToken } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

function generateTokens(userId: string, farmerId: string) {
  const secret     = process.env.JWT_SECRET!;
  const refSecret  = process.env.JWT_REFRESH_SECRET!;
  const accessToken   = jwt.sign({ userId, farmerId }, secret,    { expiresIn: '7d' });
  const refreshToken  = jwt.sign({ userId, farmerId }, refSecret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { farmer_id, password, full_name, lat, lon, location_name } = req.body;
  if (!farmer_id?.trim() || !password || !full_name?.trim())
    return res.status(400).json({ error: 'farmer_id, password and full_name are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (db.users.findByFarmerId(farmer_id.trim()))
    return res.status(409).json({ error: 'Farmer ID already exists. Please choose another.' });

  const id = uuidv4();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);
  const user: UserRecord = {
    id, farmer_id: farmer_id.trim(), password_hash: passwordHash,
    full_name: full_name.trim(),
    lat: lat ?? 23.0822, lon: lon ?? 88.5228,
    location_name: location_name ?? 'Chakdaha, West Bengal',
    created_at: now, updated_at: now,
  };
  db.users.insert(user);

  const { accessToken, refreshToken } = generateTokens(id, farmer_id);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const rt: RefreshToken = { id: uuidv4(), user_id: id, token_hash: tokenHash, expires_at: new Date(Date.now() + 30*86400000).toISOString(), created_at: now };
  db.tokens.insert(rt);

  const { password_hash, ...safeUser } = user;
  return res.status(201).json({ user: safeUser, accessToken, refreshToken });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { farmer_id, password } = req.body;
  if (!farmer_id || !password)
    return res.status(400).json({ error: 'farmer_id and password are required' });

  const user = db.users.findByFarmerId(farmer_id);
  if (!user) return res.status(401).json({ error: 'Invalid Farmer ID or Password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid Farmer ID or Password' });

  const { accessToken, refreshToken } = generateTokens(user.id, user.farmer_id);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const rt: RefreshToken = { id: uuidv4(), user_id: user.id, token_hash: tokenHash, expires_at: new Date(Date.now() + 30*86400000).toISOString(), created_at: new Date().toISOString() };
  db.tokens.insert(rt);

  const { password_hash, ...safeUser } = user;
  return res.json({ user: safeUser, accessToken, refreshToken });
});

// POST /api/auth/refresh
router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string; farmerId: string };
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const stored = db.tokens.findByHash(tokenHash);
    if (!stored || new Date(stored.expires_at) < new Date())
      return res.status(401).json({ error: 'Refresh token expired or invalid' });

    db.tokens.deleteByHash(tokenHash);
    const { accessToken, refreshToken: newRT } = generateTokens(payload.userId, payload.farmerId);
    const newHash = crypto.createHash('sha256').update(newRT).digest('hex');
    db.tokens.insert({ id: uuidv4(), user_id: payload.userId, token_hash: newHash, expires_at: new Date(Date.now() + 30*86400000).toISOString(), created_at: new Date().toISOString() });

    return res.json({ accessToken, refreshToken: newRT });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    db.tokens.deleteByHash(hash);
  }
  return res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  const user = db.users.find(req.userId!);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password_hash, ...safeUser } = user;
  return res.json({ user: safeUser });
});

export default router;
