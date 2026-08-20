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
  low:      '#1B5E20',
  medium:   '#FFD600',
  high:     '#FF6600',
  critical: '#D50000',
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
          const color = plot ? RISK_COLORS[plot.pest_risk] : '#1B5E20';
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:36px;height:36px;border-radius:50%;
              background:${color};border:4px solid #000;
              display:flex;align-items:center;justify-content:center;
              font-size:14px;font-weight:900;color:${color === '#FFD600' ? '#000' : '#fff'};
              box-shadow:3px 3px 0 0 rgba(0,0,0,1);
            ">${loc.crop[0]}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          const marker = L.marker([loc.lat, loc.lon], { icon });
          marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <b style="font-size:14px">${loc.name}</b><br/>
              <span style="font-size:12px">Crop: <b>${loc.crop}</b></span><br/>
              <span style="font-size:12px;color:${color}">Risk: <b>${plot?.pest_risk?.toUpperCase() ?? 'UNKNOWN'}</b></span>
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
            color:       '#000000',
            weight:      3,
            fillColor:   RISK_COLORS[alert.severity],
            fillOpacity: opacity,
          });
          circle.bindTooltip(`${alert.pest_name} · ${alert.severity.toUpperCase()}`, { permanent: false });
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
          color:       '#000000',
          weight:      3,
          fillColor:   RISK_COLORS[alert.severity],
          fillOpacity: opacity,
        });
        circle.bindTooltip(`${alert.pest_name} · Day +${timelineDay}`, { permanent: false });
        (mapObj.current as { addLayer: (l: unknown) => void }).addLayer(circle);
        layersRef.current.push(circle);
      });
    });
  }, [timelineDay]);

  return (
    <section className="w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#D50000] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Bug className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-black text-3xl text-black tracking-tight">{t.map_title}</h2>
        </div>
        <div className="flex items-center gap-3 bg-[#FFFDE7] border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Wind className="w-5 h-5 text-black" />
          <span className="font-black text-lg text-black">{MOCK_WIND.speed_kmh}</span>
          <span className="text-sm font-bold text-black">km/h</span>
        </div>
      </div>

      {/* Timeline Slider */}
      <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black text-lg text-black uppercase">
            📅 DISEASE SPREAD TIMELINE
          </h3>
          <span className={cn(
            'px-4 py-1 border-4 border-black font-black text-base',
            timelineDay === 0 ? 'bg-[#1B5E20] text-white' :
            timelineDay < 7  ? 'bg-[#FFD600] text-black' : 'bg-[#D50000] text-white'
          )}>
            {timelineDay === 0 ? 'NOW' : `DAY +${timelineDay}`}
          </span>
        </div>
        <input
          type="range" min={0} max={14} step={1} value={timelineDay}
          onChange={(e) => setTimelineDay(Number(e.target.value))}
          className="w-full h-4 accent-black cursor-pointer"
          style={{ accentColor: '#D50000' }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs font-bold text-black">NOW</span>
          <span className="text-xs font-bold text-black">+7 DAYS</span>
          <span className="text-xs font-bold text-black">+14 DAYS</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#FFFDE7]">
            <RefreshCw className="w-12 h-12 text-black animate-spin" />
            <p className="font-black text-xl text-black mt-3">{t.map_loading}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#D50000]">
            <p className="font-black text-xl text-white">{error}</p>
          </div>
        )}
        <div ref={mapRef} style={{ height: '480px', width: '100%' }} />

        {/* Legend overlay */}
        {showLegend && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
            <p className="font-black text-xs text-black uppercase mb-2">RISK LEGEND</p>
            {(['critical','high','medium','low'] as const).map((level) => (
              <div key={level} className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 border-2 border-black" style={{ background: RISK_COLORS[level] }} />
                <span className="text-xs font-bold text-black uppercase">{level}</span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowLegend((v) => !v)}
          className="absolute bottom-4 right-4 z-[1000] bg-[#FFD600] border-4 border-black p-2
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          title="Toggle legend"
        >
          <Layers className="w-5 h-5 text-black" />
        </button>
      </div>

      {/* Farm locations grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {farmLocations.map((loc, i) => {
          const plot = MOCK_PLOTS[i];
          const color = plot ? RISK_COLORS[plot.pest_risk] : '#1B5E20';
          return (
            <button key={loc.id} onClick={() => setSelectedPlot(plot ?? null)}
              className={cn(
                'bg-[#FFFDE7] border-4 border-black p-4 text-left transition-all duration-100',
                selectedPlot?.id === plot?.id
                  ? 'shadow-none translate-x-[4px] translate-y-[4px]'
                  : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              )}>
              <div className="w-8 h-8 border-2 border-black mb-2 flex items-center justify-center font-black text-xs"
                style={{ background: color, color: color === '#FFD600' ? '#000' : '#fff' }}>
                {loc.crop[0]}
              </div>
              <p className="font-black text-sm text-black leading-tight">{loc.name}</p>
              <p className="text-xs font-bold text-black mt-1">{loc.crop}</p>
              {plot && (
                <p className="text-xs font-bold mt-1" style={{ color }}>
                  {plot.pest_risk.toUpperCase()}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected plot detail */}
      {selectedPlot && (
        <div className="bg-[#FFFDE7] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 animate-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-xl text-black">PLOT DETAILS</h3>
            <button onClick={() => setSelectedPlot(null)}
              className="font-black text-sm text-black border-2 border-black px-3 py-1 bg-[#FFD600] hover:bg-black hover:text-[#FFD600] transition-colors">
              CLOSE ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Crop',     value: selectedPlot.crop },
              { label: 'Area',     value: `${selectedPlot.area_hectare} ha` },
              { label: 'Risk',     value: selectedPlot.pest_risk.toUpperCase() },
              { label: 'Updated',  value: selectedPlot.last_updated },
            ].map(({ label, value }) => (
              <div key={label} className="border-2 border-black p-3 bg-white">
                <p className="text-xs font-bold text-black uppercase">{label}</p>
                <p className="font-black text-lg text-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active pest alerts */}
      <div className="space-y-3">
        {MOCK_ALERTS.map((alert) => (
          <div key={alert.id} className={cn(
            'border-4 border-black p-4 flex items-start gap-4',
            alert.severity === 'critical' ? 'bg-[#D50000] text-white' : 'bg-[#FFD600] text-black'
          )}>
            <Bug className="w-7 h-7 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-black text-lg">{alert.pest_name}</p>
              <p className="font-bold text-sm mt-1 opacity-80">
                {alert.radius_km}km radius · {alert.wind_speed_kmh} km/h wind · Affects: {alert.affected_crops.join(', ')}
              </p>
            </div>
            <span className="font-black text-sm border-4 border-current px-3 py-1 shrink-0">
              {alert.severity.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
