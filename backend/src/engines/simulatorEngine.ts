// ============================================================
// SIMULATOR ENGINE — Team Member: Simulator Dev
// Crop Yield Simulation based on historical climate data
// ============================================================

export interface SimPayload {
  year: number;
  day: number;
  actions: string[];
}

export interface SimResult {
  yield_kg_per_hectare: number;
  carbon_delta: number;
  soil_moisture_pct: number;
  rainfall_mm: number;
  temperature_anomaly: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Historical climate baselines by era
function getClimateBaseline(year: number) {
  if (year < 1985) return { rainfall: 1420, carbon: 0.78, tempAnomaly: -0.2, baseYield: 3200 };
  if (year < 2000) return { rainfall: 1380, carbon: 0.65, tempAnomaly: 0.1, baseYield: 3800 };
  if (year < 2015) return { rainfall: 1310, carbon: 0.52, tempAnomaly: 0.4, baseYield: 4200 };
  return             { rainfall: 1250, carbon: 0.44, tempAnomaly: 0.8, baseYield: 4600 };
}

// Action effect multipliers
const ACTION_EFFECTS: Record<string, { waterMod: number; yieldMod: number; carbonMod: number; pestRisk: number }> = {
  irrigation:      { waterMod: 0.20, yieldMod: 0.15, carbonMod: -0.02, pestRisk: 0.05 },
  compost:         { waterMod: 0.05, yieldMod: 0.20, carbonMod: 0.08,  pestRisk: -0.05 },
  biospray:        { waterMod: 0.00, yieldMod: 0.05, carbonMod: -0.01, pestRisk: -0.30 },
  miss_irrigation: { waterMod: -0.25, yieldMod: -0.20, carbonMod: 0.01, pestRisk: 0.10 },
  harvest:         { waterMod: 0.00, yieldMod: 0.00, carbonMod: 0.00,  pestRisk: 0.00 },
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function runSimulation(payload: SimPayload): SimResult {
  const { year, day, actions } = payload;
  const base = getClimateBaseline(year);

  // Base values
  let waterMod = 0;
  let yieldMod = 0;
  let carbonMod = 0;
  let pestRiskScore = 0;

  // Apply action effects
  for (const action of actions) {
    const effect = ACTION_EFFECTS[action];
    if (effect) {
      waterMod    += effect.waterMod;
      yieldMod    += effect.yieldMod;
      carbonMod   += effect.carbonMod;
      pestRiskScore += effect.pestRisk;
    }
  }

  // Growth stage factor (0..1 over 90-day season)
  const growthFactor = Math.sin((day / 90) * Math.PI);

  // Final computed values
  const soilMoisture = clamp(55 + waterMod * 100 + growthFactor * 10, 10, 95);
  const yieldKg      = clamp(base.baseYield * (1 + yieldMod) * growthFactor, 200, 8000);
  const carbonDelta  = base.carbon + carbonMod;
  const rainfallMm   = base.rainfall * (1 + (Math.random() - 0.5) * 0.1);  // ±5% noise
  const tempAnomaly  = base.tempAnomaly + (year > 2010 ? (year - 2010) * 0.03 : 0);

  // Risk assessment
  pestRiskScore = clamp(0.2 + pestRiskScore, 0, 1);
  let risk_level: SimResult['risk_level'];
  let message: string;

  if (pestRiskScore < 0.2 && soilMoisture > 50) {
    risk_level = 'low';
    message = 'Crop health is excellent. Continue current farming practices.';
  } else if (pestRiskScore < 0.45) {
    risk_level = 'medium';
    message = 'Moderate pest risk detected. Consider applying bio-spray soon.';
  } else if (pestRiskScore < 0.70) {
    risk_level = 'high';
    message = 'High pest pressure. Apply bio-spray and monitor daily.';
  } else {
    risk_level = 'critical';
    message = 'Critical risk! Immediate intervention required — contact local agri-officer.';
  }

  return {
    yield_kg_per_hectare: Math.round(yieldKg),
    carbon_delta:         parseFloat(carbonDelta.toFixed(3)),
    soil_moisture_pct:    parseFloat(soilMoisture.toFixed(1)),
    rainfall_mm:          parseFloat(rainfallMm.toFixed(1)),
    temperature_anomaly:  parseFloat(tempAnomaly.toFixed(2)),
    risk_level,
    message,
  };
}
