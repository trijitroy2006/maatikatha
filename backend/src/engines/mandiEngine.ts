// ============================================================
// MANDI ENGINE — Team Member: Mandi Dev
// Market price computation based on crop & harvest date
// ============================================================

export interface MandiResult {
  crop: string;
  msp_per_quintal: number;
  market_price_per_quintal: number;
  best_sell_window: string;
  nearby_mandis: { name: string; distance_km: number; price_per_quintal: number }[];
}

// Minimum Support Prices (MSP) — Government of India 2024-25
const MSP_2024: Record<string, number> = {
  Rice:    2300,
  Wheat:   2275,
  Potato:  1000,
  Jute:    5050,
  Mustard: 5950,
  Maize:   2090,
  Sugarcane: 3400,
  Cotton:  7121,
};

// Seasonal price variation factors by month
const SEASONAL_FACTOR: Record<number, number> = {
  1: 1.12, 2: 1.08, 3: 1.05, 4: 1.02, 5: 1.00,
  6: 0.98, 7: 0.95, 8: 0.97, 9: 1.00, 10: 0.95,
  11: 1.05, 12: 1.10,
};

// Best sell windows by crop
const BEST_SELL_WINDOWS: Record<string, string> = {
  Rice:    'Nov 15 – Dec 15 (Post-harvest demand peak)',
  Wheat:   'Apr 20 – May 10 (Before govt procurement ends)',
  Potato:  'Mar 1 – Mar 20 (Before cold storage rush)',
  Jute:    'Sep 10 – Oct 10 (Mill demand peak)',
  Mustard: 'Apr 5 – Apr 25 (Oil mill buying season)',
  Maize:   'Dec 1 – Dec 20 (Poultry feed demand)',
  Cotton:  'Nov 1 – Dec 1 (Ginning season start)',
};

// Nadia District mandis (West Bengal)
const NADIA_MANDIS = [
  { name: 'Krishnanagar Mandi',  distance_km: 14 },
  { name: 'Ranaghat Mandi',      distance_km: 22 },
  { name: 'Chakdaha Mandi',      distance_km: 6  },
  { name: 'Kalyani Mandi',       distance_km: 18 },
  { name: 'Haringhata Mandi',    distance_km: 12 },
];

export function computeMandiPrice(crop: string, harvestDate: string): MandiResult {
  const normalizedCrop = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  const msp = MSP_2024[normalizedCrop] ?? 2000;

  const harvestMonth = harvestDate ? new Date(harvestDate).getMonth() + 1 : new Date().getMonth() + 1;
  const seasonalFactor = SEASONAL_FACTOR[harvestMonth] ?? 1.0;

  // Market price = MSP × seasonal factor × small random market noise
  const noise = 1 + (Math.random() * 0.06 - 0.03); // ±3%
  const marketPrice = Math.round(msp * seasonalFactor * noise);

  const bestWindow = BEST_SELL_WINDOWS[normalizedCrop] ?? 'Check with your local Krishi Seva Kendra';

  // Generate mandi prices with slight variation
  const nearby_mandis = NADIA_MANDIS.map(m => ({
    name: m.name,
    distance_km: m.distance_km,
    price_per_quintal: Math.round(marketPrice * (1 + (Math.random() * 0.04 - 0.02))),
  })).sort((a, b) => b.price_per_quintal - a.price_per_quintal);

  return {
    crop: normalizedCrop,
    msp_per_quintal: msp,
    market_price_per_quintal: marketPrice,
    best_sell_window: bestWindow,
    nearby_mandis,
  };
}
