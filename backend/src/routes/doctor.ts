import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { DoctorQuery } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { diagnose } from '../engines/doctorEngine';

const router = Router();

router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const { textQuery, lang } = req.body;
  const result = diagnose({ textQuery, lang });

  if (req.userId) {
    const record: DoctorQuery = {
      id: uuidv4(), user_id: req.userId,
      query_text: textQuery || '', answer_text: result.answer_text,
      diagnosis: result.diagnosis || null, severity: result.severity,
      created_at: new Date().toISOString(),
    };
    db.doctor.insert(record);
  }
  return res.json(result);
});

router.get('/history', optionalAuth, (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  return res.json({ history: db.doctor.byUser(req.userId) });
});

export default router;
