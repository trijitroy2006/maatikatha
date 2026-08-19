// ============================================================
// MaatiKatha — Typed API Client
// Connects to Udit's Express REST backend
// ============================================================

import type {
  SimulatorPayload,
  SimulatorResponse,
  ClimatePayload,
  ClimateResponse,
  DoctorPayload,
  DoctorResponse,
  MandiPayload,
  MandiPrice,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error ${res.status}: ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

// ---- POST /api/simulator ----
export async function runSimulator(
  payload: SimulatorPayload
): Promise<SimulatorResponse> {
  return request<SimulatorResponse>('/api/simulator', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---- GET /api/climate ----
export async function getClimateData(
  payload: ClimatePayload
): Promise<ClimateResponse> {
  const params = new URLSearchParams({
    lat: String(payload.lat),
    lon: String(payload.lon),
  });
  return request<ClimateResponse>(`/api/climate?${params.toString()}`, {
    method: 'GET',
  });
}

// ---- POST /api/doctor ----
export async function queryDoctor(
  payload: DoctorPayload
): Promise<DoctorResponse> {
  if (payload.audioBlob) {
    // Multipart for audio blobs
    const formData = new FormData();
    formData.append('audio', payload.audioBlob, 'recording.webm');
    formData.append('lang', payload.lang);
    const url = `${BASE_URL}/api/doctor`;
    const res = await fetch(url, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json() as Promise<DoctorResponse>;
  }

  return request<DoctorResponse>('/api/doctor', {
    method: 'POST',
    body: JSON.stringify({ textQuery: payload.textQuery, lang: payload.lang }),
  });
}

// ---- GET /api/mandi ----
export async function getMandiPrice(
  payload: MandiPayload
): Promise<MandiPrice> {
  const params = new URLSearchParams({
    crop: payload.crop,
    harvestDate: payload.harvestDate,
  });
  return request<MandiPrice>(`/api/mandi?${params.toString()}`, {
    method: 'GET',
  });
}
