'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import { Wind, Bug, RefreshCw, Layers } from 'lucide-react';
import type { PlotMarker, PestAlert, WindData } from '@/lib/types';

export interface FarmLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  crop: string;
}

const DEFAULT_LOCATIONS: FarmLocation[] = [
  { id: 'f1', name: 'Plot A – Chakdaha', lat: 23.0822, lon: 88.5228, crop: 'Rice' },
  { id: 'f2', name: 'Plot B – Kalyani',  lat: 22.9754, lon: 88.4342, crop: 'Jute' },
  { id: 'f3', name: 'Plot C – Haringhata', lat: 22.9529, lon: 88.5621, crop: 'Potato' },
  { id: 'f4', name: 'Plot D – Ranaghat',  lat: 23.1780, lon: 88.5610, crop: 'Mustard' },
];

const MOCK_PLOTS: PlotMarker[] = [
  { id: 'p1', lat: 23.0822, lon: 88.5228, crop: 'Rice',    area_hectare: 2.4, pest_risk: 'critical', last_updated: '2 hrs ago' },
  { id: 'p2', lat: 22.9754, lon: 88.4342, crop: 'Jute',    area_hectare: 1.8, pest_risk: 'high',     last_updated: '4 hrs ago' },
  { id: 'p3', lat: 22.9529, lon: 88.5621, crop: 'Potato',  area_hectare: 1.2, pest_risk: 'medium',   last_updated: '6 hrs ago' },
  { id: 'p4', lat: 23.1780, lon: 88.5610, crop: 'Mustard', area_hectare: 3.1, pest_risk: 'low',      last_updated: '1 hr ago'  },
];

const MOCK_ALERTS: PestAlert[] = [
  { id: 'a1', pest_name: 'Rice Blast',          pest_name_bn: 'রাইস ব্লাস্ট',    center_lat: 23.0822, center_lon: 88.5228, radius_km: 3.5, wind_speed_kmh: 18, wind_direction_deg: 225, severity: 'critical', affected_crops: ['Rice'] },
  { id: 'a2', pest_name: 'Brown Plant Hopper',  pest_name_bn: 'বাদামি গাছ ফড়িং', center_lat: 22.9754, center_lon: 88.4342, radius_km: 2.0, wind_speed_kmh: 12, wind_direction_deg: 180, severity: 'high',     affected_crops: ['Rice', 'Jute'] },
];

const MOCK_WIND: WindData = { speed_kmh: 18, direction_deg: 225, gusts_kmh: 28 };

const RISK_COLORS: Record<string, string> = {
  low:      '#10b981', // emerald-500
  medium:   '#f59e0b', // amber-500
  high:     '#f97316', // orange-500
  critical: '#e11d48', // rose-600
};

const RISK_OPACITY = (base: number, day: number) =>
  Math.min(0.85, base + (day / 14) * 0.3);

interface PestRadarMapProps {
  farmLocations?: FarmLocation[];
}

export function PestRadarMap({ farmLocations = DEFAULT_LOCATIONS }: PestRadarMapProps) {
  const { t } = useI18n();
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapObj  = useRef<unknown>(null);
  const layersRef = useRef<unknown[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [timelineDay, setTimelineDay] = useState(0); // 0 = now, 14 = 14 days ahead
  const [selectedPlot, setSelectedPlot] = useState<PlotMarker | null>(null);
  const [showLegend, setShowLegend]     = useState(true);

  // Load Leaflet and render map
  useEffect(() => {
    let map: unknown;
    const init = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!mapRef.current || mapObj.current) return;

        // Fix default icons
        (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl = undefined;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const centerLat = farmLocations.reduce((s, f) => s + f.lat, 0) / farmLocations.length;
        const centerLon = farmLocations.reduce((s, f) => s + f.lon, 0) / farmLocations.length;

        map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true })
          .setView([centerLat, centerLon], 10);
        mapObj.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map as any);

        // Farm location markers
        farmLocations.forEach((loc) => {
          const plot = MOCK_PLOTS.find((p) => p.id === `p${farmLocations.indexOf(loc) + 1}`);
          const color = plot ? RISK_COLORS[plot.pest_risk] : '#10b981';
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:36px;height:36px;border-radius:50%;
              background:${color};border:2px solid #ffffff;
              display:flex;align-items:center;justify-content:center;
              font-size:14px;font-weight:600;color:#ffffff;
              box-shadow:0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
            ">${loc.crop[0]}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          const marker = L.marker([loc.lat, loc.lon], { icon });
          marker.bindPopup(`
            <div style="font-family:inherit;min-width:160px;padding:4px;">
              <b style="font-size:14px;color:#1f2937;">${loc.name}</b><br/>
              <span style="font-size:13px;color:#4b5563;">Crop: <b style="color:#111827;">${loc.crop}</b></span><br/>
              <span style="font-size:13px;color:#4b5563;">Risk: <b style="color:${color}">${plot?.pest_risk?.toUpperCase() ?? 'UNKNOWN'}</b></span>
            </div>
          `);
          marker.on('click', () => { if (plot) setSelectedPlot(plot); });
          (map as { addLayer: (l: unknown) => void }).addLayer(marker);
        });

        // Draw pest circles
        MOCK_ALERTS.forEach((alert) => {
          const opacity = RISK_OPACITY(0.25, timelineDay);
          const radius  = alert.radius_km * 1000 * (1 + (timelineDay / 14) * 0.4);
          const circle = L.circle([alert.center_lat, alert.center_lon], {
            radius,
            color:       RISK_COLORS[alert.severity],
            weight:      2,
            fillColor:   RISK_COLORS[alert.severity],
            fillOpacity: opacity,
          });
          circle.bindTooltip(`${alert.pest_name} · ${alert.severity.toUpperCase()}`, { permanent: false, className: 'rounded-lg shadow-md border-0 bg-white/95 backdrop-blur-sm' });
          (map as { addLayer: (l: unknown) => void }).addLayer(circle);
          layersRef.current.push(circle);
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to load map');
        setIsLoading(false);
        console.error(err);
      }
    };
    init();
    return () => {
      if (mapObj.current) {
        (mapObj.current as { remove: () => void }).remove();
        mapObj.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update pest circles when timeline changes
  useEffect(() => {
    if (!mapObj.current) return;
    import('leaflet').then(({ default: L }) => {
      // Remove old circles
      layersRef.current.forEach((layer) => {
        (mapObj.current as { removeLayer: (l: unknown) => void })?.removeLayer(layer);
      });
      layersRef.current = [];

      // Re-draw with new radius/opacity
      MOCK_ALERTS.forEach((alert) => {
        const opacity = RISK_OPACITY(0.25, timelineDay);
        const radius  = alert.radius_km * 1000 * (1 + (timelineDay / 14) * 0.4);
        const circle = L.circle([alert.center_lat, alert.center_lon], {
          radius,
          color:       RISK_COLORS[alert.severity],
          weight:      2,
          fillColor:   RISK_COLORS[alert.severity],
          fillOpacity: opacity,
        });
        circle.bindTooltip(`${alert.pest_name} · Day +${timelineDay}`, { permanent: false, className: 'rounded-lg shadow-md border-0 bg-white/95 backdrop-blur-sm' });
        (mapObj.current as { addLayer: (l: unknown) => void }).addLayer(circle);
        layersRef.current.push(circle);
      });
    });
  }, [timelineDay]);

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 shadow-sm">
            <Bug className="w-7 h-7 text-rose-600" />
          </div>
          <h2 className="font-semibold text-2xl text-gray-900 tracking-tight">{t.map_title}</h2>
        </div>
        <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm">
          <Wind className="w-5 h-5 text-sky-500" />
          <div className="flex items-baseline gap-1">
            <span className="font-semibold text-lg text-gray-900">{MOCK_WIND.speed_kmh}</span>
            <span className="text-sm font-medium text-gray-500">km/h</span>
          </div>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-sm text-gray-500 tracking-wider uppercase">
            Disease Spread Timeline
          </h3>
          <span className={cn(
            'px-3 py-1 rounded-full font-medium text-sm',
            timelineDay === 0 ? 'bg-emerald-50 text-emerald-700' :
            timelineDay < 7  ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
          )}>
            {timelineDay === 0 ? 'Current State' : `Day +${timelineDay}`}
          </span>
        </div>
        <div className="relative w-full">
          <input
            type="range" min={0} max={14} step={1} value={timelineDay}
            onChange={(e) => setTimelineDay(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
        <div className="flex justify-between mt-3 px-1">
          <span className="text-xs font-medium text-gray-400">Now</span>
          <span className="text-xs font-medium text-gray-400">+7 Days</span>
          <span className="text-xs font-medium text-gray-400">+14 Days</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-2xl border border-gray-100 shadow-lg overflow-hidden bg-white ring-1 ring-black/5">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="font-medium text-gray-600 mt-4">{t.map_loading}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-rose-50">
            <p className="font-medium text-rose-600">{error}</p>
          </div>
        )}
        <div ref={mapRef} style={{ height: '520px', width: '100%' }} />

        {/* Legend overlay */}
        {showLegend && (
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 backdrop-blur-md rounded-xl border border-gray-100 shadow-xl p-4 min-w-[140px]">
            <p className="font-semibold text-xs text-gray-500 tracking-wider uppercase mb-3">Risk Level</p>
            {(['critical','high','medium','low'] as const).map((level) => (
              <div key={level} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: RISK_COLORS[level] }} />
                <span className="text-sm font-medium text-gray-700 capitalize">{level}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="absolute bottom-6 right-6 z-[1000] bg-white text-gray-700 border border-gray-100 p-3 rounded-xl
            shadow-lg hover:bg-gray-50 hover:shadow-xl transition-all"
          title="Toggle legend"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Farm locations grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {farmLocations.map((loc, i) => {
          const plot = MOCK_PLOTS[i];
          const color = plot ? RISK_COLORS[plot.pest_risk] : '#10b981';
          const isSelected = selectedPlot?.id === plot?.id;
          return (
            <button key={loc.id} onClick={() => setSelectedPlot(plot ?? null)}
              className={cn(
                'flex flex-col items-start p-5 rounded-2xl text-left transition-all duration-200 border',
                isSelected
                  ? 'bg-emerald-50 border-emerald-200 shadow-md ring-1 ring-emerald-500'
                  : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
              )}>
              <div className="w-10 h-10 rounded-full mb-3 flex items-center justify-center font-semibold text-sm shadow-sm"
                style={{ background: color, color: '#fff' }}>
                {loc.crop[0]}
              </div>
              <p className="font-semibold text-gray-900 leading-tight mb-1">{loc.name}</p>
              <p className="text-sm text-gray-500">{loc.crop}</p>
              {plot && (
                <div className="mt-auto pt-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" 
                    style={{ backgroundColor: `${color}15`, color }}>
                    {plot.pest_risk.toUpperCase()}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected plot detail */}
      {selectedPlot && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-gray-900">Plot Details</h3>
            <button onClick={() => setSelectedPlot(null)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100">
              Close ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Crop',     value: selectedPlot.crop },
              { label: 'Area',     value: `${selectedPlot.area_hectare} ha` },
              { label: 'Risk',     value: selectedPlot.pest_risk.toUpperCase(), color: RISK_COLORS[selectedPlot.pest_risk] },
              { label: 'Updated',  value: selectedPlot.last_updated },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                <p className="font-semibold text-gray-900" style={color ? { color } : undefined}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active pest alerts */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-gray-900 pt-2">Active Alerts</h3>
        {MOCK_ALERTS.map((alert) => (
          <div key={alert.id} className={cn(
            'rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition-all',
            alert.severity === 'critical' ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-amber-50 border-amber-100 text-amber-900'
          )}>
            <div className={cn(
              'p-3 rounded-xl shrink-0 w-fit',
              alert.severity === 'critical' ? 'bg-rose-100' : 'bg-amber-100'
            )}>
              <Bug className={cn("w-6 h-6", alert.severity === 'critical' ? 'text-rose-600' : 'text-amber-600')} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{alert.pest_name}</p>
              <p className="font-medium text-sm mt-1.5 opacity-80 leading-relaxed">
                {alert.radius_km}km radius · {alert.wind_speed_kmh} km/h wind<br/>
                Affects: {alert.affected_crops.join(', ')}
              </p>
            </div>
            <div className="shrink-0 pt-1 sm:pt-0">
              <span className={cn(
                "font-semibold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider",
                alert.severity === 'critical' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
              )}>
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
