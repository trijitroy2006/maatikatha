'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import type { Language, I18nDictionary } from '@/lib/types';

// ============================================================
// Bengali Dictionary (bn)
// ============================================================
const bn: I18nDictionary = {
  // App
  app_name: 'মাটিকথা',
  tagline: 'কৃষকের কণ্ঠস্বর, মাটির কথা',
  // Navigation
  nav_home: 'হোম',
  nav_simulator: 'সিমুলেটর',
  nav_climate: 'ঋতুরক্ষক',
  nav_doctor: 'মাঠ ডাক্তার',
  nav_map: 'খামার দৃষ্টি',
  // Simulator
  sim_title: 'ফসল সিমুলেটর',
  sim_year_label: 'সাল (১৯৭৫–২০২৬)',
  sim_day_label: 'দিন (১–৯০)',
  sim_actions_label: 'কার্যক্রম নির্বাচন করুন',
  sim_run_btn: 'ফলাফল দেখুন',
  sim_yield_label: 'ফলন (কেজি/হেক্টর)',
  sim_carbon_label: 'কার্বন পরিবর্তন',
  sim_moisture_label: 'মাটির আর্দ্রতা (%)',
  sim_rainfall_label: 'বৃষ্টিপাত (মিমি)',
  sim_temp_label: 'তাপমাত্রা বিচ্যুতি',
  sim_risk_label: 'ঝুঁকির মাত্রা',
  sim_action_irrigation: 'সেচ দেওয়া',
  sim_action_compost: 'কম্পোস্ট যোগ',
  sim_action_biospray: 'জৈব স্প্রে',
  sim_action_miss_irrig: 'সেচ বাদ দেওয়া',
  sim_action_harvest: 'ফসল কাটা',
  // Climate
  climate_title: 'ঋতুরক্ষক জলবায়ু কার্ড',
  climate_baseline_label: '৪০ বছরের গড়',
  climate_forecast_label: '১৪ দিনের পূর্বাভাস',
  climate_sowing_shift: 'বপন পরিবর্তন',
  climate_seeds_label: 'প্রস্তাবিত বীজ',
  climate_mulching_label: 'মালচিং পরামর্শ',
  climate_alert_normal: 'স্বাভাবিক',
  climate_alert_watch: 'সতর্ক থাকুন',
  climate_alert_warning: 'সাবধানতা',
  climate_alert_critical: 'জরুরি সতর্কতা',
  climate_step1_title: '১. বপনের সময় পরিবর্তন করুন',
  climate_step2_title: '২. ঐতিহ্যবাহী বীজ ব্যবহার করুন',
  climate_step3_title: '৩. মাটি মালচিং করুন',
  climate_loading: 'জলবায়ু তথ্য লোড হচ্ছে...',
  // Doctor
  doctor_title: 'AI মাঠ ডাক্তার',
  doctor_prompt: 'ফসলের সমস্যা বলুন',
  doctor_listening: 'শুনছি...',
  doctor_processing: 'বিশ্লেষণ হচ্ছে...',
  doctor_tap_speak: 'কথা বলতে ট্যাপ করুন',
  doctor_lang_bn: 'বাংলা',
  doctor_lang_hi: 'হিন্দি',
  doctor_severity_info: 'তথ্য',
  doctor_severity_caution: 'সতর্কতা',
  doctor_severity_urgent: 'জরুরি',
  // Map
  map_title: 'খামার দৃষ্টি পেস্ট রাডার',
  map_loading: 'মানচিত্র লোড হচ্ছে...',
  map_pest_alert: 'পোকার সতর্কতা',
  map_wind_label: 'বায়ু',
  map_plot_label: 'জমির তথ্য',
  map_risk_low: 'কম ঝুঁকি',
  map_risk_medium: 'মধ্যম ঝুঁকি',
  map_risk_high: 'বেশি ঝুঁকি',
  map_risk_critical: 'সর্বোচ্চ ঝুঁকি',
  // Common
  loading: 'লোড হচ্ছে...',
  error: 'ত্রুটি',
  retry: 'আবার চেষ্টা করুন',
  close: 'বন্ধ করুন',
  submit: 'জমা দিন',
  days: 'দিন',
  years: 'সাল',
};

// ============================================================
// English Fallback Dictionary (en)
// ============================================================
const en: I18nDictionary = {
  app_name: 'MaatiKatha',
  tagline: "The farmer's voice, the soil's story",
  nav_home: 'Home',
  nav_simulator: 'Simulator',
  nav_climate: 'RituRakhok',
  nav_doctor: 'Field Doctor',
  nav_map: 'KhamarDrishti',
  sim_title: 'Crop Simulator',
  sim_year_label: 'Year (1975–2026)',
  sim_day_label: 'Day (1–90)',
  sim_actions_label: 'Select Actions',
  sim_run_btn: 'Run Simulation',
  sim_yield_label: 'Yield (kg/ha)',
  sim_carbon_label: 'Carbon Delta',
  sim_moisture_label: 'Soil Moisture (%)',
  sim_rainfall_label: 'Rainfall (mm)',
  sim_temp_label: 'Temp Anomaly',
  sim_risk_label: 'Risk Level',
  sim_action_irrigation: 'Irrigation',
  sim_action_compost: 'Compost Addition',
  sim_action_biospray: 'Bio-spray',
  sim_action_miss_irrig: 'Missed Irrigation',
  sim_action_harvest: 'Harvest',
  climate_title: 'RituRakhok Climate Card',
  climate_baseline_label: '40-Year Baseline',
  climate_forecast_label: '14-Day Forecast',
  climate_sowing_shift: 'Sowing Shift',
  climate_seeds_label: 'Recommended Seeds',
  climate_mulching_label: 'Mulching Advice',
  climate_alert_normal: 'Normal',
  climate_alert_watch: 'Watch',
  climate_alert_warning: 'Warning',
  climate_alert_critical: 'Critical Alert',
  climate_step1_title: '1. Adjust Sowing Date',
  climate_step2_title: '2. Use Heritage Seeds',
  climate_step3_title: '3. Apply Soil Mulching',
  climate_loading: 'Loading climate data...',
  doctor_title: 'AI Field Doctor',
  doctor_prompt: 'Describe your crop problem',
  doctor_listening: 'Listening...',
  doctor_processing: 'Analyzing...',
  doctor_tap_speak: 'Tap to Speak',
  doctor_lang_bn: 'Bengali',
  doctor_lang_hi: 'Hindi',
  doctor_severity_info: 'Info',
  doctor_severity_caution: 'Caution',
  doctor_severity_urgent: 'Urgent',
  map_title: 'KhamarDrishti Pest Radar',
  map_loading: 'Loading map...',
  map_pest_alert: 'Pest Alert',
  map_wind_label: 'Wind',
  map_plot_label: 'Plot Info',
  map_risk_low: 'Low Risk',
  map_risk_medium: 'Medium Risk',
  map_risk_high: 'High Risk',
  map_risk_critical: 'Critical Risk',
  loading: 'Loading...',
  error: 'Error',
  retry: 'Try Again',
  close: 'Close',
  submit: 'Submit',
  days: 'Days',
  years: 'Years',
};

const dictionaries: Record<Language, I18nDictionary> = { bn, en };

// ============================================================
// Context
// ============================================================
interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: I18nDictionary;
}

const I18nContext = createContext<I18nContextValue>({
  language: 'bn',
  setLanguage: () => {},
  t: bn,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: dictionaries[language],
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
