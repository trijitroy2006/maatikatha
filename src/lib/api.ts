// ============================================================
// MaatiKatha — API Client (connects to Express backend)
// Automatically falls back to mock data if backend is offline
// ============================================================

import type {
  SimulatorPayload, SimulatorResponse,
  ClimatePayload, ClimateResponse,
  DoctorPayload, DoctorResponse,
  MandiPayload, MandiPrice,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

// ---- Auth token helpers ----
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mk_access_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ---- Auth API ----
export async function apiRegister(payload: {
  farmer_id: string; password: string; full_name: string;
  lat?: number; lon?: number; location_name?: string;
}) {
  return request<{ user: any; accessToken: string; refreshToken: string }>('/api/auth/register', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function apiLogin(farmer_id: string, password: string) {
  return request<{ user: any; accessToken: string; refreshToken: string }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ farmer_id, password }),
  });
}

export async function apiLogout(refreshToken?: string) {
  return request('/api/auth/logout', {
    method: 'POST', body: JSON.stringify({ refreshToken }),
  });
}

export async function apiMe() {
  return request<{ user: any }>('/api/auth/me');
}

// ---- Farm API ----
export async function apiFarmPlots() {
  return request<{ plots: any[] }>('/api/farm/plots');
}

export async function apiCreatePlot(payload: any) {
  return request<{ plot: any }>('/api/farm/plots', {
    method: 'POST', body: JSON.stringify(payload),
  });
}

export async function apiUpdateLocation(lat: number, lon: number, location_name?: string) {
  return request('/api/farm/location', {
    method: 'PUT', body: JSON.stringify({ lat, lon, location_name }),
  });
}

// ---- Simulator (with mock fallback) ----
const MOCK_SIM: SimulatorResponse = {
  yield_kg_per_hectare: 3800, carbon_delta: 0.52,
  soil_moisture_pct: 67.4, rainfall_mm: 1310,
  temperature_anomaly: 0.4, risk_level: 'medium',
  message: 'Offline mode — connect backend for live simulation.',
};

export async function runSimulator(payload: SimulatorPayload): Promise<SimulatorResponse> {
  try {
    return await request<SimulatorResponse>('/api/simulator', {
      method: 'POST', body: JSON.stringify(payload),
    });
  } catch {
    return MOCK_SIM;
  }
}

// ---- Climate (with mock fallback) ----
const MOCK_CLIMATE: ClimateResponse = {
  baseline_40yr: { avg_rainfall_mm: 1380, avg_temp_celsius: 26.5, organic_carbon_pct: 0.58, onset_date: 'June 5', cessation_date: 'October 10' },
  forecast_14d: Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
    rainfall_mm: Math.random() > 0.5 ? parseFloat((Math.random() * 20).toFixed(1)) : 0,
    temp_max: parseFloat((30 + Math.random() * 5).toFixed(1)),
    temp_min: parseFloat((22 + Math.random() * 3).toFixed(1)),
    humidity_pct: Math.round(65 + Math.random() * 20),
    condition: Math.random() > 0.6 ? 'Rainy' : 'Partly Cloudy',
  })),
  sowing_shift_days: 3, recommended_seeds: ['IR36 (Rain-fed Rice)', 'Shatabdi (Flood-Tolerant)'],
  mulching_action: 'Apply rice straw mulch to reduce soil temperature',
  alert_level: 'watch',
};

export async function getClimateData(payload: ClimatePayload): Promise<ClimateResponse> {
  try {
    const params = new URLSearchParams({ lat: String(payload.lat), lon: String(payload.lon) });
    return await request<ClimateResponse>(`/api/climate?${params}`);
  } catch {
    return MOCK_CLIMATE;
  }
}

// ---- Doctor (with mock fallback) ----
const MOCK_DOCTOR: DoctorResponse = {
  answer_text: 'Backend offline — using mock response. Describe symptoms to get advice.',
  severity: 'info',
  recommended_actions: ['Restart the backend server to get live AI diagnosis.'],
};

export async function queryDoctor(payload: DoctorPayload): Promise<DoctorResponse> {
  try {
    if (payload.audioBlob) {
      const formData = new FormData();
      formData.append('audio', payload.audioBlob, 'recording.webm');
      formData.append('lang', payload.lang);
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/api/doctor`, { method: 'POST', body: formData, headers });
      if (!res.ok) throw new Error('Doctor API error');
      return res.json();
    }
    return await request<DoctorResponse>('/api/doctor', {
      method: 'POST', body: JSON.stringify({ textQuery: payload.textQuery, lang: payload.lang }),
    });
  } catch {
    return MOCK_DOCTOR;
  }
}

// ---- Mandi (with mock fallback) ----
const MOCK_MANDI: MandiPrice = {
  crop: 'Rice', msp_per_quintal: 2300, market_price_per_quintal: 2480,
  best_sell_window: 'Nov 15 – Dec 15 (Offline mode)',
  nearby_mandis: [
    { name: 'Krishnanagar Mandi', distance_km: 14, price_per_quintal: 2480 },
    { name: 'Chakdaha Mandi',     distance_km: 6,  price_per_quintal: 2340 },
  ],
};

export async function getMandiPrice(payload: MandiPayload): Promise<MandiPrice> {
  try {
    const params = new URLSearchParams({ crop: payload.crop, harvestDate: payload.harvestDate });
    return await request<MandiPrice>(`/api/mandi?${params}`);
  } catch {
    return MOCK_MANDI;
  }
}
