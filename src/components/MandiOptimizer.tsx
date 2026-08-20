'use client';

import { useEffect, useState } from 'react';
import { Loader2, TrendingUp, MapPin, Calendar, Wheat } from 'lucide-react';
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
  if (risk < 40)  return 'text-[#1B5E20]';
  if (risk <= 70) return 'text-[#F57F17]';
  return 'text-[#D50000]';
}

function rainRiskLabel(risk: number): string {
  if (risk < 40)  return 'LOW';
  if (risk <= 70) return 'MODERATE';
  return 'HIGH';
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
      <h1 className="font-black text-3xl text-black mb-6 tracking-tight">
        🌾 MANDI PROFIT OPTIMIZER
      </h1>

      {/* ------------------------------------------------------------------ */}
      {/* Controls row                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Crop selector */}
        <div className="flex flex-col gap-1">
          <label className="font-black text-xs uppercase tracking-widest flex items-center gap-1">
            <Wheat size={14} /> CROP
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="border-4 border-black bg-white p-3 text-lg font-bold min-h-[56px] focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Harvest date */}
        <div className="flex flex-col gap-1">
          <label className="font-black text-xs uppercase tracking-widest flex items-center gap-1">
            <Calendar size={14} /> HARVEST DATE
          </label>
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className="border-4 border-black bg-white p-3 text-lg font-bold min-h-[56px] focus:outline-none focus:ring-2 focus:ring-[#FFD600]"
          />
        </div>

        {/* Analyse button */}
        <div className="flex flex-col justify-end">
          <button
            onClick={handleAnalyse}
            disabled={isLoading}
            className="bg-[#FFD600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       font-black text-lg px-8 py-3 min-h-[56px]
                       hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                       transition-all active:translate-x-[2px] active:translate-y-[2px]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'LOADING…' : 'ANALYSE'}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Rain Risk Slider                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8 border-4 border-black bg-white p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-black text-sm uppercase tracking-widest">
            RAIN RISK IN 7 DAYS
          </span>
          <span className={`font-black text-2xl ${rainRiskColor(rainRisk)}`}>
            {rainRisk}%&nbsp;
            <span className="text-base">{rainRiskLabel(rainRisk)}</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={rainRisk}
          onChange={(e) => setRainRisk(Number(e.target.value))}
          className="w-full h-3 cursor-pointer accent-[#D50000]"
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-bold text-[#1B5E20]">0% — DRY</span>
          <span className="text-xs font-bold text-[#D50000]">100% — FLOOD RISK</span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Loading skeleton                                                     */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin w-16 h-16 text-black" />
          <p className="font-black text-lg text-black tracking-wide">
            Fetching mandi prices…
          </p>
        </div>
      ) : data ? (
        <>
          {/* -------------------------------------------------------------- */}
          {/* Main grid                                                        */}
          {/* -------------------------------------------------------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD – Market Prices */}
            <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              {/* Card header */}
              <div className="flex items-center gap-2 border-b-4 border-black pb-3 mb-4">
                <TrendingUp size={20} className="text-black" />
                <h2 className="font-black text-xl text-black uppercase tracking-wide">
                  MARKET PRICES
                </h2>
              </div>

              {/* MSP price */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-base text-black">MSP (Govt. Rate)</span>
                <span className="font-black text-2xl text-black">
                  ₹{data.msp_per_quintal.toLocaleString('en-IN')}/q
                </span>
              </div>

              {/* Market price */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-base text-black">Market Price</span>
                <span className="font-black text-3xl text-[#1B5E20]">
                  ₹{data.market_price_per_quintal.toLocaleString('en-IN')}/q
                </span>
              </div>

              {/* Profit margin label */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-black uppercase tracking-wide">
                  Profit Over MSP
                </span>
                <span
                  className={`font-black text-base ${
                    profitMargin >= 0 ? 'text-[#1B5E20]' : 'text-[#D50000]'
                  }`}
                >
                  {profitMargin >= 0 ? '+' : ''}
                  {profitMargin.toFixed(1)}%
                </span>
              </div>

              {/* Profit bar */}
              <div className="bg-stone-200 border-2 border-black h-6 mb-5">
                <div
                  className="h-full bg-[#1B5E20] border-2 border-black transition-all duration-500"
                  style={{ width: `${profitBarWidth}%` }}
                />
              </div>

              {/* Best sell window */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-black uppercase tracking-wide">
                  Best Sell Window
                </span>
                <span className="bg-[#FFD600] border-2 border-black px-3 py-1 font-bold text-black text-sm">
                  {data.best_sell_window}
                </span>
              </div>
            </div>

            {/* RIGHT CARD – Nearby Mandis */}
            <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
              {/* Card header */}
              <div className="flex items-center gap-2 border-b-4 border-black pb-3 mb-4">
                <MapPin size={20} className="text-black" />
                <h2 className="font-black text-xl text-black uppercase tracking-wide">
                  NEARBY MANDIS
                </h2>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <span className="font-black text-xs uppercase tracking-widest">NAME</span>
                <span className="font-black text-xs uppercase tracking-widest text-center">
                  DIST.
                </span>
                <span className="font-black text-xs uppercase tracking-widest text-right">
                  PRICE/Q
                </span>
              </div>

              {/* Mandi rows */}
              {data.nearby_mandis.map((mandi, idx) => {
                const isBest = mandi.price_per_quintal === bestMandiPrice;
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-3 gap-2 border-b-2 border-black py-3 items-center
                      ${isBest ? 'bg-[#FFD600] -mx-2 px-2' : ''}`}
                  >
                    <div>
                      <span
                        className={`font-bold text-sm text-black ${
                          isBest ? 'font-black' : ''
                        }`}
                      >
                        {mandi.name}
                      </span>
                      {isBest && (
                        <span className="block text-xs font-black text-black uppercase">
                          ⭐ BEST
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm text-black text-center">
                      {mandi.distance_km} km
                    </span>
                    <span
                      className={`font-black text-base text-right ${
                        isBest ? 'text-[#1B5E20]' : 'text-black'
                      }`}
                    >
                      ₹{mandi.price_per_quintal.toLocaleString('en-IN')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/* Decision card                                                    */}
          {/* -------------------------------------------------------------- */}
          {decision === 'HARVEST NOW' ? (
            <div
              className="mt-6 bg-[#1B5E20] border-4 border-black
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center"
            >
              <p className="text-white font-black text-5xl tracking-tight mb-2">
                HARVEST NOW ✅
              </p>
              <p className="text-white text-xl mt-2">
                Market price is above MSP and rain risk is low.
              </p>
            </div>
          ) : (
            <div
              className="mt-6 bg-[#FFD600] border-4 border-black
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center"
            >
              <p className="text-black font-black text-5xl tracking-tight mb-2">
                WAIT ⏳
              </p>
              <p className="text-black text-xl mt-2">
                Rain risk is high or price is below optimal threshold.
              </p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
