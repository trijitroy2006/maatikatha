import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { DoctorQuery as DbDoctorQuery } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { diagnose } from '../engines/doctorEngine';

const router = Router();

router.post('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const { textQuery, lang } = req.body;

  try {
    const result = await diagnose({ textQuery, lang });

    // Log query if user is authenticated
    if (req.userId && !result.lang_mismatch) {
      try {
        const record: DbDoctorQuery = {
          id: uuidv4(),
          user_id: req.userId,
          query_text: textQuery || '',
          answer_text: result.answer_text,
          diagnosis: result.diagnosis || null,
          severity: result.severity,
          created_at: new Date().toISOString(),
        };
        db.doctor.insert(record);
      } catch (e) {
        console.warn('Could not log doctor query:', e);
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('Doctor route error:', err);
    return res.status(500).json({ error: 'Failed to process query' });
  }
});

// GET /api/doctor/history
router.get('/history', optionalAuth, (req: AuthRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  return res.json({ history: db.doctor.byUser(req.userId) });
});

export default router;
