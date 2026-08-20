'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Loader2 } from 'lucide-react';

const FALLBACK_LAT = 23.0822;
const FALLBACK_LON = 88.5228;
const FALLBACK_NAME = 'Chakdaha, West Bengal';

export default function AuthModal() {
  const { isAuthenticated, login, setFarmLocation } = useAuth();

  const [farmerName, setFarmerName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);

  // If already authenticated, don't show the modal
  if (isAuthenticated) return null;

  const handleLocate = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          setDetectedLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: data.display_name || FALLBACK_NAME
          });
        } catch {
          setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
        setIsLocating(false);
      }
    );
  };

  const handleStart = () => {
    if (!farmerName.trim()) return;
    const loc = detectedLocation || { lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME };
    setFarmLocation(loc.lat, loc.lon, loc.name);
    login(farmerName.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFDE7] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full mt-20 p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-black text-4xl text-black">MAATIKATHA</h1>
          <p className="font-bold text-black mt-2">The Farmer's Voice</p>
        </div>

        <input 
          type="text" 
          value={farmerName}
          onChange={(e) => setFarmerName(e.target.value)}
          placeholder="Enter your name..."
          className="border-4 border-black bg-white p-4 text-xl font-bold w-full focus:bg-[#FFD600] outline-none"
        />

        <button 
          onClick={handleLocate}
          disabled={isLocating}
          className="bg-[#FFD600] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-black font-black text-lg px-6 py-4 w-full flex items-center justify-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-h-[56px] disabled:opacity-50"
        >
          {isLocating ? <Loader2 className="animate-spin w-6 h-6" /> : <MapPin className="w-6 h-6" />}
          {isLocating ? 'LOCATING...' : 'LOCATE MY FARM'}
        </button>

        {detectedLocation && (
          <div className="flex items-center gap-2 justify-center">
            <span className="bg-[#FFD600] px-3 py-1 border-2 border-black font-bold flex items-center gap-1 text-sm text-black">
              <MapPin className="w-4 h-4" /> {detectedLocation.name}
            </span>
          </div>
        )}

        <button 
          onClick={handleStart}
          disabled={!farmerName.trim()}
          className="bg-[#1B5E20] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black text-lg px-6 py-4 w-full flex items-center justify-center transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-h-[56px] disabled:opacity-50"
        >
          START FARMING
        </button>
      </div>
    </div>
  );
}
