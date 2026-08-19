'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/contexts/i18nContext';
import { cn } from '@/lib/utils';
import { Wind, Bug, MapPin, RefreshCw } from 'lucide-react';
import type { PlotMarker, PestAlert, WindData } from '@/lib/types';

// ---- Mock data for demonstration ----
const MOCK_PLOTS: PlotMarker[] = [
  { id: 'p1', lat: 23.06, lon: 88.44, crop: 'Rice',    area_hectare: 1.2, pest_risk: 'high',     last_updated: '2026-08-19' },
  { id: 'p2', lat: 23.09, lon: 88.48, crop: 'Jute',    area_hectare: 0.8, pest_risk: 'low',      last_updated: '2026-08-19' },
  { id: 'p3', lat: 23.03, lon: 88.41, crop: 'Mustard', area_hectare: 2.1, pest_risk: 'critical', last_updated: '2026-08-19' },
  { id: 'p4', lat: 23.11, lon: 88.42, crop: 'Potato',  area_hectare: 0.5, pest_risk: 'medium',   last_updated: '2026-08-19' },
];

const MOCK_ALERTS: PestAlert[] = [
  {
    id: 'a1',
    pest_name: 'Rice Blast',
    pest_name_bn: 'Rice Blast',
    center_lat: 23.04, center_lon: 88.42,
    radius_km: 3.5, wind_speed_kmh: 18, wind_direction_deg: 225,
    severity: 'critical',
    affected_crops: ['Rice', 'Wheat'],
  },
  {
    id: 'a2',
    pest_name: 'Brown Plant Hopper',
    pest_name_bn: 'Brown Plant Hopper',
    center_lat: 23.10, center_lon: 88.46,
    radius_km: 2.0, wind_speed_kmh: 12, wind_direction_deg: 180,
    severity: 'high',
    affected_crops: ['Rice'],
  },
];

const MOCK_WIND: WindData = {
  speed_kmh: 18,
  direction_deg: 225,
  gusts_kmh: 26,
};

const RISK_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const RISK_BG = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

export function KhamarDrishtiMap() {
  const { t } = useI18n();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<PlotMarker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic import — Leaflet requires DOM and cannot be SSR'd
    let isMounted = true;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!isMounted || !mapRef.current || leafletMapRef.current) return;

        // Fix default icon paths for Next.js bundling
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        const map = L.map(mapRef.current, {
          center: [23.06, 88.44],
          zoom: 12,
          zoomControl: true,
          attributionControl: false,
        });

        leafletMapRef.current = map;

        // Dark tile layer — better for high-contrast rural UX
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '© OpenStreetMap © CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
          }
        ).addTo(map);

        // ---- Plot Markers ----
        MOCK_PLOTS.forEach((plot) => {
          const color = RISK_COLORS[plot.pest_risk];

          const icon = L.divIcon({
            className: '',
            html: `
              <div style="
                width:36px;height:36px;border-radius:50%;
                background:${color};border:3px solid #fff;
                display:flex;align-items:center;justify-content:center;
                font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.5);
                cursor:pointer;
              ">🌾</div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          const marker = L.marker([plot.lat, plot.lon], { icon }).addTo(map);

          marker.bindTooltip(
            `<div style="font-family:sans-serif;padding:4px 8px;">
              <b>${plot.crop}</b> · ${plot.area_hectare} ha<br/>
              <span style="color:${color}">● ${plot.pest_risk.toUpperCase()} RISK</span>
            </div>`,
            { permanent: false, direction: 'top' }
          );

          marker.on('click', () => {
            if (isMounted) setSelectedPlot(plot);
          });
        });

        // ---- Pest Alert Circles ----
        MOCK_ALERTS.forEach((alert) => {
          const color = RISK_COLORS[alert.severity];

          // Spread circle
          L.circle([alert.center_lat, alert.center_lon], {
            radius: alert.radius_km * 1000,
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: '8 4',
          }).addTo(map).bindTooltip(
            `<b>${alert.pest_name_bn}</b><br/>${alert.pest_name}`,
            { direction: 'top' }
          );

          // Wind direction arrow — draw as a polyline
          const rad = (alert.wind_direction_deg * Math.PI) / 180;
          const arrowLen = 0.012; // ~1.2km in lat/lon units
          const dLat = Math.cos(rad) * arrowLen;
          const dLon = Math.sin(rad) * arrowLen;

          const arrows: [number, number][] = [
            [alert.center_lat, alert.center_lon],
            [alert.center_lat + dLat, alert.center_lon + dLon],
          ];

          L.polyline(arrows, {
            color: '#f59e0b',
            weight: 3,
            dashArray: '6 4',
          }).addTo(map);

          // Arrow head
          L.circleMarker([alert.center_lat + dLat, alert.center_lon + dLon], {
            radius: 5,
            color: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 1,
            weight: 0,
          }).addTo(map);
        });

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          setError('Map failed to load. Please check connectivity.');
          setIsLoading(false);
        }
        console.error(err);
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <section className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 rounded-xl">
            <Bug className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-400">
            {t.map_title}
          </h2>
        </div>
        <div className="flex items-center gap-2 bg-stone-800 border border-stone-600 rounded-xl px-3 py-2">
          <Wind className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-stone-200 font-bold">{MOCK_WIND.speed_kmh}</span>
          <span className="text-xs text-stone-400">km/h</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-600">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-900/80 gap-3">
            <RefreshCw className="w-10 h-10 text-red-400 animate-spin" />
            <p className="text-stone-300">{t.map_loading}</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-stone-900/90 gap-3 p-4">
            <Bug className="w-10 h-10 text-red-400" />
            <p className="text-stone-300 text-sm text-center">{error}</p>
          </div>
        )}
        <div ref={mapRef} className="w-full h-[380px] bg-stone-900" />
      </div>

      {/* Risk Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.keys(RISK_COLORS) as Array<keyof typeof RISK_COLORS>).map((risk) => (
          <div key={risk} className="flex items-center gap-1.5">
            <div className={cn('w-3 h-3 rounded-full', RISK_BG[risk])} />
            <span className="text-xs text-stone-400 font-bengali">
              {t[`map_risk_${risk}` as keyof typeof t]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-6 h-0.5 bg-amber-400 border-dashed border border-amber-400" />
          <span className="text-xs text-stone-400">Wind Flow</span>
        </div>
      </div>

      {/* Active Pest Alerts */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-stone-300 uppercase tracking-wide">
          🚨 {t.map_pest_alert}
        </h3>
        {MOCK_ALERTS.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border',
              alert.severity === 'critical'
                ? 'bg-red-900/40 border-red-600'
                : 'bg-orange-900/40 border-orange-600'
            )}
          >
            <div className={cn('w-3 h-3 rounded-full shrink-0', RISK_BG[alert.severity])} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-100 text-sm">{alert.pest_name_bn}</p>
              <p className="text-xs text-stone-400 truncate">
                {alert.pest_name} · {alert.radius_km}km · {alert.wind_speed_kmh}km/h
              </p>
            </div>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-bold text-stone-900', RISK_BG[alert.severity])}>
              {alert.severity.toUpperCase()}
            </span>
          </div>
        ))}
      </div>

      {/* Plot Detail Drawer */}
      {selectedPlot && (
        <div className="bg-stone-800 border border-stone-600 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <p className="font-bold text-stone-100">{t.map_plot_label}</p>
            </div>
            <button onClick={() => setSelectedPlot(null)} className="text-stone-500 hover:text-stone-300 text-sm">
              {t.close}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <InfoRow label="Crop"     value={selectedPlot.crop} />
            <InfoRow label="Area"     value={`${selectedPlot.area_hectare} ha`} />
            <InfoRow label="Location" value={`${selectedPlot.lat.toFixed(3)}°N`} />
            <InfoRow label="Risk"     value={t[`map_risk_${selectedPlot.pest_risk}` as keyof typeof t] as string} />
          </div>
        </div>
      )}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="text-sm font-semibold text-stone-200">{value}</p>
    </div>
  );
}
