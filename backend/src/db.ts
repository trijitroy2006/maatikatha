// ============================================================
// MaatiKatha — JSON File Database (zero native dependencies)
// Stores all data in data/db.json, auto-created on startup
// ============================================================
import fs from 'fs';
import path from 'path';

const DB_DIR  = path.resolve('./data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// ---- Data Shape ----
export interface UserRecord {
  id: string;
  farmer_id: string;
  password_hash: string;
  full_name: string;
  lat: number;
  lon: number;
  location_name: string;
  created_at: string;
  updated_at: string;
}

export interface FarmPlot {
  id: string;
  user_id: string;
  name: string;
  lat: number;
  lon: number;
  area_hectare: number;
  crop: string;
  pest_risk: 'low' | 'medium' | 'high' | 'critical';
  soil_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimResult {
  id: string;
  user_id: string | null;
  year: number;
  day: number;
  actions: string[];
  yield_kg_per_hectare: number;
  carbon_delta: number;
  soil_moisture_pct: number;
  rainfall_mm: number;
  temperature_anomaly: number;
  risk_level: string;
  message: string;
  created_at: string;
}

export interface PestAlert {
  id: string;
  pest_name: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_crops: string[];
  wind_speed_kmh: number;
  wind_direction_deg: number;
  active: boolean;
  created_at: string;
  expires_at: string | null;
}

export interface DoctorQuery {
  id: string;
  user_id: string | null;
  query_text: string;
  answer_text: string;
  diagnosis: string | null;
  severity: string;
  created_at: string;
}

export interface FieldUpload {
  id: string;
  user_id: string | null;
  plot_id: string | null;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  analysis_result: object | null;
  uploaded_at: string;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

interface DbSchema {
  users: Record<string, UserRecord>;
  farm_plots: Record<string, FarmPlot>;
  simulation_results: Record<string, SimResult>;
  pest_alerts: Record<string, PestAlert>;
  doctor_queries: Record<string, DoctorQuery>;
  field_uploads: Record<string, FieldUpload>;
  refresh_tokens: Record<string, RefreshToken>;
}

// ---- In-memory store ----
let _db: DbSchema = {
  users: {},
  farm_plots: {},
  simulation_results: {},
  pest_alerts: {},
  doctor_queries: {},
  field_uploads: {},
  refresh_tokens: {},
};

// ---- Persistence ----
function load(): void {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      _db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch {
      console.warn('⚠️  Could not parse db.json — starting fresh');
    }
  }
}

function save(): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(_db, null, 2));
}

// ---- Table accessors ----
export const db = {
  // Generic helpers
  get<K extends keyof DbSchema>(table: K): DbSchema[K] {
    return _db[table];
  },
  set<K extends keyof DbSchema>(table: K, data: DbSchema[K]): void {
    _db[table] = data;
    save();
  },

  // Typed helpers
  users: {
    find: (id: string) => _db.users[id],
    findByFarmerId: (farmer_id: string) =>
      Object.values(_db.users).find(u => u.farmer_id === farmer_id),
    insert: (record: UserRecord) => { _db.users[record.id] = record; save(); },
    update: (id: string, patch: Partial<UserRecord>) => {
      if (_db.users[id]) { _db.users[id] = { ..._db.users[id], ...patch, updated_at: new Date().toISOString() }; save(); }
    },
    all: () => Object.values(_db.users),
  },
  plots: {
    find: (id: string) => _db.farm_plots[id],
    byUser: (userId: string) => Object.values(_db.farm_plots).filter(p => p.user_id === userId),
    insert: (record: FarmPlot) => { _db.farm_plots[record.id] = record; save(); },
    update: (id: string, patch: Partial<FarmPlot>) => {
      if (_db.farm_plots[id]) { _db.farm_plots[id] = { ..._db.farm_plots[id], ...patch, updated_at: new Date().toISOString() }; save(); }
    },
    delete: (id: string) => { delete _db.farm_plots[id]; save(); },
  },
  sims: {
    byUser: (userId: string) =>
      Object.values(_db.simulation_results)
        .filter(s => s.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20),
    insert: (record: SimResult) => { _db.simulation_results[record.id] = record; save(); },
  },
  pest: {
    all: () => Object.values(_db.pest_alerts),
    active: () => Object.values(_db.pest_alerts).filter(a => {
      if (!a.active) return false;
      if (a.expires_at && new Date(a.expires_at) < new Date()) return false;
      return true;
    }),
    insert: (record: PestAlert) => { _db.pest_alerts[record.id] = record; save(); },
  },
  doctor: {
    byUser: (userId: string) =>
      Object.values(_db.doctor_queries)
        .filter(q => q.user_id === userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 20),
    insert: (record: DoctorQuery) => { _db.doctor_queries[record.id] = record; save(); },
  },
  uploads: {
    byUser: (userId: string) =>
      Object.values(_db.field_uploads)
        .filter(u => u.user_id === userId)
        .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
        .slice(0, 20),
    insert: (record: FieldUpload) => { _db.field_uploads[record.id] = record; save(); },
  },
  tokens: {
    findByHash: (hash: string) => Object.values(_db.refresh_tokens).find(t => t.token_hash === hash),
    insert: (record: RefreshToken) => { _db.refresh_tokens[record.id] = record; save(); },
    deleteByHash: (hash: string) => {
      const t = Object.values(_db.refresh_tokens).find(t => t.token_hash === hash);
      if (t) { delete _db.refresh_tokens[t.id]; save(); }
    },
  },
};

// ---- Init (seed + load) ----
export function initDb(): void {
  load();

  // Seed default pest alerts if none exist
  if (Object.keys(_db.pest_alerts).length === 0) {
    const now = new Date().toISOString();
    const alerts: PestAlert[] = [
      { id: 'pa_001', pest_name: 'Rice Blast', center_lat: 23.0822, center_lon: 88.5228, radius_km: 3.5, severity: 'critical', affected_crops: ['Rice'], wind_speed_kmh: 18, wind_direction_deg: 225, active: true, created_at: now, expires_at: null },
      { id: 'pa_002', pest_name: 'Brown Plant Hopper', center_lat: 22.9754, center_lon: 88.4342, radius_km: 2.0, severity: 'high', affected_crops: ['Rice', 'Jute'], wind_speed_kmh: 12, wind_direction_deg: 180, active: true, created_at: now, expires_at: null },
      { id: 'pa_003', pest_name: 'Late Blight', center_lat: 22.9529, center_lon: 88.5621, radius_km: 1.5, severity: 'medium', affected_crops: ['Potato'], wind_speed_kmh: 8, wind_direction_deg: 270, active: true, created_at: now, expires_at: null },
    ];
    alerts.forEach(a => { _db.pest_alerts[a.id] = a; });
    save();
  }

  console.log(`✅ Database loaded — ${Object.keys(_db.users).length} users, ${Object.keys(_db.pest_alerts).length} pest alerts`);
}
