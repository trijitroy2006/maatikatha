'use client';

import { useState, useCallback } from 'react';
import { runSimulator } from '@/lib/api';
import type { SimulatorPayload, SimulatorResponse } from '@/lib/types';

interface UseSimulatorReturn {
  result: SimulatorResponse | null;
  isLoading: boolean;
  error: string | null;
  simulate: (payload: SimulatorPayload) => Promise<void>;
}

export function useSimulator(): UseSimulatorReturn {
  const [result, setResult] = useState<SimulatorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const simulate = useCallback(async (payload: SimulatorPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await runSimulator(payload);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation failed');
      // Fallback mock result for offline/demo usage
      setResult({
        yield_kg_per_hectare: 3200 + Math.random() * 800,
        carbon_delta: -0.12 + Math.random() * 0.3,
        soil_moisture_pct: 45 + Math.random() * 30,
        rainfall_mm: 60 + Math.random() * 80,
        temperature_anomaly: -0.5 + Math.random() * 2,
        risk_level: 'medium',
        message: 'Demo mode: Backend not connected.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { result, isLoading, error, simulate };
}
