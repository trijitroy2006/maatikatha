import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { FarmPlot } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/plots', (req: AuthRequest, res: Response) => {
  const { name, lat, lon, area_hectare, crop, soil_type, notes } = req.body;
  if (!name || lat === undefined || lon === undefined)
    return res.status(400).json({ error: 'name, lat and lon are required' });

  const now = new Date().toISOString();
  const plot: FarmPlot = {
    id: uuidv4(), user_id: req.userId!, name, lat, lon,
    area_hectare: area_hectare ?? 1.0, crop: crop ?? 'Rice',
    pest_risk: 'low', soil_type: soil_type ?? 'loamy',
    notes: notes ?? null, created_at: now, updated_at: now,
  };
  db.plots.insert(plot);
  return res.status(201).json({ plot });
});

router.get('/plots', (req: AuthRequest, res: Response) => {
  const plots = db.plots.byUser(req.userId!);
  return res.json({ plots });
});

router.get('/plots/:id', (req: AuthRequest, res: Response) => {
  const plot = db.plots.find(req.params.id);
  if (!plot || plot.user_id !== req.userId) return res.status(404).json({ error: 'Plot not found' });
  return res.json({ plot });
});

router.put('/plots/:id', (req: AuthRequest, res: Response) => {
  const plot = db.plots.find(req.params.id);
  if (!plot || plot.user_id !== req.userId) return res.status(404).json({ error: 'Plot not found' });
  const { name, lat, lon, area_hectare, crop, pest_risk, soil_type, notes } = req.body;
  db.plots.update(req.params.id, { name, lat, lon, area_hectare, crop, pest_risk, soil_type, notes });
  return res.json({ plot: db.plots.find(req.params.id) });
});

router.delete('/plots/:id', (req: AuthRequest, res: Response) => {
  const plot = db.plots.find(req.params.id);
  if (!plot || plot.user_id !== req.userId) return res.status(404).json({ error: 'Plot not found' });
  db.plots.delete(req.params.id);
  return res.json({ message: 'Plot deleted' });
});

router.put('/location', (req: AuthRequest, res: Response) => {
  const { lat, lon, location_name } = req.body;
  if (lat === undefined || lon === undefined) return res.status(400).json({ error: 'lat and lon required' });
  db.users.update(req.userId!, { lat, lon, location_name });
  return res.json({ message: 'Location updated', lat, lon, location_name });
});

export default router;
