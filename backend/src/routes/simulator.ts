import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { SimResult } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { runSimulation } from '../engines/simulatorEngine';

const router = Router();

router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const { year, day, actions } = req.body;
  if (year === undefined || day === undefined) return res.status(400).json({ error: 'year and day are required' });
  if (year < 1975 || year > 2030) return res.status(400).json({ error: 'year must be 1975–2030' });
  if (day < 1 || day > 90)        return res.status(400).json({ error: 'day must be 1–90' });

  const result = runSimulation({ year, day, actions: actions || [] });

  if (req.userId) {
    const record: SimResult = {
      id: uuidv4(), user_id: req.userId, year, day, actions: actions || [],
      ...result, created_at: new Date().toISOString(),
    };
    db.sims.insert(record);
  }

  return res.json(result);
});

router.get('/history', optionalAuth, (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  return res.json({ history: db.sims.byUser(req.userId) });
});

export default router;
