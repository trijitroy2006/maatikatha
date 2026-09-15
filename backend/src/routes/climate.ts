// ============================================================
// CLIMATE ROUTE — Team Member: Climate Dev
// GET /api/climate?lat=&lon=
// ============================================================
import { Router, Request, Response } from 'express';
import { fetchClimateData } from '../engines/climateEngine';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lon = parseFloat(req.query.lon as string);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon query parameters are required' });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ error: 'lat must be -90..90 and lon must be -180..180' });
  }

  try {
    const data = await fetchClimateData(lat, lon);
    return res.json(data);
  } catch (err) {
    console.error('Climate fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch climate data' });
  }
});

export default router;
