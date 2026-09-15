// ============================================================
// MaatiKatha — Full TypeScript Type Definitions
// ============================================================

// ---- Simulator ----
export interface SimulatorPayload {
  year: number;
  day: number;
  actions: string[];
}

export interface SimulatorResponse {
  yield_kg_per_hectare: number;
  carbon_delta: number;
  soil_moisture_pct: number;
  rainfall_mm: number;
  temperature_anomaly: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

export interface HistoricalBaseline {
  year: number;
  rainfall_mm: number;
  organic_carbon: number;
  temperature_anomaly: number;
}

// ---- Climate ----
export interface ClimatePayload {
  lat: number;
  lon: number;
}

export interface ClimateBaseline {
  avg_rainfall_mm: number;
  avg_temp_celsius: number;
  organic_carbon_pct: number;
  onset_date: string;
  cessation_date: string;
}

export interface ForecastDay {
  date: string;
  rainfall_mm: number;
  temp_max: number;
  temp_min: number;
  humidity_pct: number;
  condition: string;
}

export interface ClimateResponse {
  baseline_40yr: ClimateBaseline;
  forecast_14d: ForecastDay[];
  sowing_shift_days: number;
  recommended_seeds: string[];
  mulching_action: string;
  alert_level: 'normal' | 'watch' | 'warning' | 'critical';
}

// ---- Voice Doctor ----
export type SupportedLang   = 'bn' | 'hi' | 'en';
export type SpeechLangCode  = 'bn-IN' | 'hi-IN' | 'en-IN';

export interface DoctorPayload {
  textQuery?: string;
  audioBlob?: Blob;
  lang: SupportedLang;
}

export interface DoctorResponse {
  answer_text: string;
  answer_audio_url?: string;
  diagnosis?: string;
  severity: 'info' | 'caution' | 'urgent';
  recommended_actions: string[];
}

// ---- Mandi Price ----
export interface MandiPayload {
  crop: string;
  harvestDate: string;
}

export interface MandiPrice {
  crop: string;
  msp_per_quintal: number;
  market_price_per_quintal: number;
  best_sell_window: string;
  nearby_mandis: MandiLocation[];
}

export interface MandiLocation {
  name: string;
  distance_km: number;
  price_per_quintal: number;
}

// ---- Pest Radar ----
export interface PlotMarker {
  id: string;
  lat: number;
  lon: number;
  crop: string;
  area_hectare: number;
  pest_risk: 'low' | 'medium' | 'high' | 'critical';
  last_updated: string;
}

export interface PestAlert {
  id: string;
  pest_name: string;
  pest_name_bn: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_crops: string[];
}

export interface WindData {
  speed_kmh: number;
  direction_deg: number;
  gusts_kmh: number;
}

// ---- i18n ----
export type Language = 'bn' | 'en';

export interface I18nDictionary {
  // App
  app_name: string;
  tagline: string;
  // Navigation
  nav_home: string;
  nav_simulator: string;
  nav_climate: string;
  nav_doctor: string;
  nav_map: string;
  // Simulator
  sim_title: string;
  sim_year_label: string;
  sim_day_label: string;
  sim_actions_label: string;
  sim_run_btn: string;
  sim_yield_label: string;
  sim_carbon_label: string;
  sim_moisture_label: string;
  sim_rainfall_label: string;
  sim_temp_label: string;
  sim_risk_label: string;
  sim_action_irrigation: string;
  sim_action_compost: string;
  sim_action_biospray: string;
  sim_action_miss_irrig: string;
  sim_action_harvest: string;
  // Climate
  climate_title: string;
  climate_baseline_label: string;
  climate_forecast_label: string;
  climate_sowing_shift: string;
  climate_seeds_label: string;
  climate_mulching_label: string;
  climate_alert_normal: string;
  climate_alert_watch: string;
  climate_alert_warning: string;
  climate_alert_critical: string;
  climate_step1_title: string;
  climate_step2_title: string;
  climate_step3_title: string;
  climate_loading: string;
  // Doctor
  doctor_title: string;
  doctor_prompt: string;
  doctor_listening: string;
  doctor_processing: string;
  doctor_tap_speak: string;
  doctor_lang_bn: string;
  doctor_lang_hi: string;
  doctor_severity_info: string;
  doctor_severity_caution: string;
  doctor_severity_urgent: string;
  // Map
  map_title: string;
  map_loading: string;
  map_pest_alert: string;
  map_wind_label: string;
  map_plot_label: string;
  map_risk_low: string;
  map_risk_medium: string;
  map_risk_high: string;
  map_risk_critical: string;
  // Common
  loading: string;
  error: string;
  retry: string;
  close: string;
  submit: string;
  days: string;
  years: string;
}
