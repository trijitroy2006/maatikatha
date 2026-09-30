import { Router, Request, Response } from 'express';
import { calculateCompostTimeline } from '../engines/compostEngine';

const router = Router();

const SUPPORTED_CROPS = [
  { name: 'Paddy / Rice Stubble',   base_days: 45, cn_ratio: 60  },
  { name: 'Wheat Straw',            base_days: 50, cn_ratio: 80  },
  { name: 'Sugarcane Bagasse',      base_days: 60, cn_ratio: 150 },
  { name: 'Vegetable Waste',        base_days: 25, cn_ratio: 20  },
  { name: 'Maize / Corn Stalks',    base_days: 40, cn_ratio: 55  },
  { name: 'Mustard Crop Residue',   base_days: 35, cn_ratio: 35  },
  { name: 'Jute Stalks',            base_days: 40, cn_ratio: 45  },
];

router.post('/', (req: Request, res: Response) => {
  const { biomass_volume_kg, crop_type, avg_temperature_celsius, moisture_pct, has_inoculant } = req.body;

  if (!biomass_volume_kg || !crop_type || avg_temperature_celsius === undefined) {
    return res.status(400).json({ error: 'biomass_volume_kg, crop_type, and avg_temperature_celsius are required' });
  }
  if (biomass_volume_kg <= 0 || biomass_volume_kg > 100000) {
    return res.status(400).json({ error: 'biomass_volume_kg must be between 1 and 100000' });
  }
  if (avg_temperature_celsius < -10 || avg_temperature_celsius > 60) {
    return res.status(400).json({ error: 'avg_temperature_celsius must be between -10 and 60' });
  }

  const result = calculateCompostTimeline({
    biomass_volume_kg: Number(biomass_volume_kg),
    crop_type: String(crop_type),
    avg_temperature_celsius: Number(avg_temperature_celsius),
    moisture_pct: moisture_pct !== undefined ? Number(moisture_pct) : undefined,
    has_inoculant: Boolean(has_inoculant),
  });

  return res.json({ ...result, input_summary: { biomass_volume_kg, crop_type, avg_temperature_celsius }, calculated_at: new Date().toISOString() });
});

router.get('/crops', (_req: Request, res: Response) => {
  return res.json({ supported_crops: SUPPORTED_CROPS });
});

export default router;
