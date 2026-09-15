// ============================================================
// MANDI ROUTE — Team Member: Mandi Dev
// GET /api/mandi?crop=Rice&harvestDate=2026-11-15
// ============================================================
import { Router, Request, Response } from 'express';
import { computeMandiPrice } from '../engines/mandiEngine';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const crop = req.query.crop as string;
  const harvestDate = req.query.harvestDate as string;

  if (!crop) {
    return res.status(400).json({ error: 'crop query parameter is required' });
  }

  try {
    const result = computeMandiPrice(crop, harvestDate || new Date().toISOString().split('T')[0]);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to compute mandi prices' });
  }
});

export default router;
