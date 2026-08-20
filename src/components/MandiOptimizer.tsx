'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, MapPin, Calendar, Wheat, CheckCircle2, Clock } from 'lucide-react';
import { getMandiPrice } from '@/lib/api';
import { MandiPrice } from '@/lib/types';

// ---------------------------------------------------------------------------
// Mock / offline fallback
// ---------------------------------------------------------------------------
const MOCK_DATA: MandiPrice = {
  crop: 'Rice',
  msp_per_quintal: 2183,
  market_price_per_quintal: 2340,
  best_sell_window: 'Aug 25 – Sep 5',
  nearby_mandis: [
    { name: 'Krishnanagar Mandi', distance_km: 14, price_per_quintal: 2340 },
    { name: 'Ranaghat Mandi',     distance_km: 22, price_per_quintal: 2290 },
    { name: 'Chakdaha Mandi',     distance_km: 6,  price_per_quintal: 2210 },
  ],
};

// ---------------------------------------------------------------------------
// Decision engine
// ---------------------------------------------------------------------------
function getDecision(data: MandiPrice, rainRisk: number): 'HARVEST NOW' | 'WAIT' {
  const priceAboveMsp = data.market_price_per_quintal > data.msp_per_quintal * 1.05;
  const lowRainRisk   = rainRisk < 40;
  return priceAboveMsp && lowRainRisk ? 'HARVEST NOW' : 'WAIT';
}

// ---------------------------------------------------------------------------
// Crop options
// ---------------------------------------------------------------------------
const CROPS = ['Rice', 'Wheat', 'Potato', 'Jute', 'Mustard'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function todayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function rainRiskColor(risk: number): string {
  if (risk < 40)  return 'text-emerald-600';
  if (risk <= 70) return 'text-amber-500';
  return 'text-red-500';
}

function rainRiskLabel(risk: number): string {
  if (risk < 40)  return 'Low';
  if (risk <= 70) return 'Moderate';
  return 'High';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function MandiOptimizer() {
  const [selectedCrop, setSelectedCrop] = useState<string>('Rice');
  const [harvestDate,  setHarvestDate]  = useState<string>(todayString());
  const [data,         setData]         = useState<MandiPrice | null>(MOCK_DATA);
  const [isLoading,    setIsLoading]    = useState<boolean>(false);
  const [rainRisk,     setRainRisk]     = useState<number>(25);

  // Fetch on mount using current defaults
  useEffect(() => {
    fetchData(selectedCrop, harvestDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData(crop: string, date: string) {
    setIsLoading(true);
    try {
      const result = await getMandiPrice({ crop, harvestDate: date });
      setData(result ?? MOCK_DATA);
    } catch {
      setData(MOCK_DATA);
    } finally {
      setIsLoading(false);
    }
  }

  function handleAnalyse() {
    fetchData(selectedCrop, harvestDate);
  }

  // Derived values
  const profitMargin   = data
    ? ((data.market_price_per_quintal - data.msp_per_quintal) / data.msp_per_quintal) * 100
    : 0;
  const profitBarWidth = clamp(profitMargin, 0, 100);
  const decision       = data ? getDecision(data, rainRisk) : null;

  const bestMandiPrice = data
    ? Math.max(...data.nearby_mandis.map((m) => m.price_per_quintal))
    : 0;

  return (
    <section className="w-full">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <TrendingUp className="w-6 h-6 text-emerald-600" />
        </div>
        <h1 className="font-bold text-2xl text-gray-900 tracking-tight">
          Mandi Profit Optimizer
        </h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Controls row                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-wrap items-end gap-6">
          {/* Crop selector */}
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-600 flex items-center gap-2">
              <Wheat size={16} className="text-gray-400" /> Crop Type
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
              >
                {CROPS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

          {/* Harvest date */}
          <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
            <label className="font-medium text-sm text-gray-600 flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" /> Harvest Date
            </label>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl px-4 py-3 text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
            />
          </div>

          {/* Analyse button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleAnalyse}
              disabled={isLoading}
              className="bg-emerald-600 text-white rounded-xl shadow-sm hover:shadow-md font-semibold text-base px-8 py-3 h-[46px] flex items-center justify-center gap-2 transition-all duration-200 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Loading...</span></> : 'Analyse Market'}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Rain Risk Slider                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
            <span>🌧️</span> 7-Day Rain Risk
          </span>
          <div className="flex items-baseline gap-2">
            <span className={`font-bold text-2xl ${rainRiskColor(rainRisk)}`}>
              {rainRisk}%
            </span>
            <span className={`font-medium text-sm ${rainRiskColor(rainRisk)}`}>{rainRiskLabel(rainRisk)}</span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={rainRisk}
          onChange={(e) => setRainRisk(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between mt-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span>0% — Dry</span>
          <span>100% — Flood Risk</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Loading skeleton                                                     */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Loader2 className="animate-spin w-10 h-10 text-emerald-500" />
          <p className="font-medium text-gray-500">
            Analyzing market conditions...
          </p>
        </div>
      ) : data ? (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Main grid                                                        */}
          {/* -------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD – Market Prices */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
              {/* Card header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  <TrendingUp size={20} />
                </div>
                <h2 className="font-semibold text-lg text-gray-900">
                  Price Analysis
                </h2>
              </div>

              <div className="space-y-6 flex-1">
                {/* MSP price */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-500">MSP (Govt. Rate)</span>
                  <span className="font-semibold text-xl text-gray-700">
                    ₹{data.msp_per_quintal.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-gray-400 ml-1">/q</span>
                  </span>
                </div>

                {/* Market price */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="font-semibold text-gray-700">Current Market</span>
                  <span className="font-bold text-2xl text-emerald-600">
                    ₹{data.market_price_per_quintal.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-emerald-600/70 ml-1">/q</span>
                  </span>
                </div>

                <div className="pt-2">
                  {/* Profit margin label */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-gray-500">
                      Profit Margin (vs MSP)
                    </span>
                    <span
                      className={`font-semibold text-sm px-2.5 py-0.5 rounded-full ${
                        profitMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {profitMargin >= 0 ? '+' : ''}
                      {profitMargin.toFixed(1)}%
                    </span>
                  </div>

                  {/* Profit bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${profitBarWidth}%` }}
                    />
                  </div>
                </div>

                {/* Best sell window */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                  <span className="font-medium text-gray-500 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" /> Optimal Window
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-lg font-medium text-sm border border-amber-200">
                    {data.best_sell_window}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT CARD – Nearby Mandis */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Card header */}
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                  <MapPin size={20} />
                </div>
                <h2 className="font-semibold text-lg text-gray-900">
                  Nearby Markets
                </h2>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 mb-3 pb-2 border-b border-gray-100">
                <span className="col-span-6 font-medium text-xs text-gray-400 uppercase tracking-wider">Market Name</span>
                <span className="col-span-3 font-medium text-xs text-gray-400 uppercase tracking-wider text-right">Distance</span>
                <span className="col-span-3 font-medium text-xs text-gray-400 uppercase tracking-wider text-right">Price/q</span>
              </div>

              {/* Mandi rows */}
              <div className="space-y-2">
                {data.nearby_mandis.map((mandi, idx) => {
                  const isBest = mandi.price_per_quintal === bestMandiPrice;
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 gap-4 py-3 px-4 rounded-xl items-center transition-colors
                        ${isBest ? 'bg-emerald-50 border border-emerald-100' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                      <div className="col-span-6 flex flex-col">
                        <span
                          className={`font-medium text-sm ${
                            isBest ? 'text-emerald-900' : 'text-gray-700'
                          }`}
                        >
                          {mandi.name}
                        </span>
                        {isBest && (
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">
                            Highest Price
                          </span>
                        )}
                      </div>
                      <span className={`col-span-3 text-sm text-right ${isBest ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {mandi.distance_km} km
                      </span>
                      <span
                        className={`col-span-3 font-semibold text-right ${
                          isBest ? 'text-emerald-600' : 'text-gray-900'
                        }`}
                      >
                        ₹{mandi.price_per_quintal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Decision card                                                    */}
          {/* -------------------------------------------------------------- */}
          <div className="mt-8">
            {decision === 'HARVEST NOW' ? (
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg border border-emerald-400 p-8 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                    <p className="text-white font-bold text-3xl tracking-tight">
                      Harvest Now
                    </p>
                  </div>
                  <p className="text-emerald-50 text-lg font-medium opacity-90">
                    Market price is above MSP and rain risk is favorable.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Wheat className="w-10 h-10 text-white" />
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl shadow-lg border border-amber-300 p-8 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-8 h-8 text-amber-900" />
                    <p className="text-amber-950 font-bold text-3xl tracking-tight">
                      Wait To Harvest
                    </p>
                  </div>
                  <p className="text-amber-900/80 text-lg font-medium">
                    High rain risk or market prices are currently below optimal levels.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Clock className="w-10 h-10 text-amber-900" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
