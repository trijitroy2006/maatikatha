import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { PestAlert } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

router.get('/', (req: AuthRequest, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);
  const radius = parseFloat(req.query.radius as string) || 100;

  let alerts = db.pest.active();
  if (!isNaN(lat) && !isNaN(lon)) {
    alerts = alerts.filter(a => haversine(lat, lon, a.center_lat, a.center_lon) <= (a.radius_km + radius));
  }
  return res.json({ alerts, total: alerts.length });
});

router.get('/all', (req: AuthRequest, res: Response) => {
  return res.json({ alerts: db.pest.all() });
});

router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  const { pest_name, center_lat, center_lon, radius_km, severity, affected_crops, wind_speed_kmh, wind_direction_deg, expires_at } = req.body;
  if (!pest_name || center_lat === undefined || center_lon === undefined)
    return res.status(400).json({ error: 'pest_name, center_lat, center_lon required' });

  const record: PestAlert = {
    id: `pa_${uuidv4().slice(0,8)}`, pest_name, center_lat, center_lon,
    radius_km: radius_km ?? 2.0, severity: severity ?? 'medium',
    affected_crops: affected_crops || [], wind_speed_kmh: wind_speed_kmh ?? 0,
    wind_direction_deg: wind_direction_deg ?? 0, active: true,
    created_at: new Date().toISOString(), expires_at: expires_at ?? null,
  };
  db.pest.insert(record);
  return res.status(201).json({ message: 'Pest alert created', id: record.id });
});

export default router;
