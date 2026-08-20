'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Loader2, User, Phone } from 'lucide-react';

const FALLBACK_LAT = 23.0822;
const FALLBACK_LON = 88.5228;
const FALLBACK_NAME = 'Chakdaha, West Bengal';

export default function AuthModal() {
  const { isAuthenticated, login, setFarmLocation } = useAuth();

  const [farmerName, setFarmerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full mt-16 p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-bold text-3xl text-gray-900 tracking-tight">Maatikatha</h1>
          <p className="text-gray-500 font-medium">The Farmer's Voice</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                placeholder="Enter your name"
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
            <div className="relative flex shadow-sm rounded-xl overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-shadow">
              <span className="inline-flex items-center px-3 bg-gray-50 text-gray-500 sm:text-sm border-r border-gray-200 font-medium">
                +91
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="00000 00000"
                className="flex-1 block w-full px-3 py-3 text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLocate}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {isLocating ? <Loader2 className="animate-spin w-5 h-5" /> : <MapPin className="w-5 h-5" />}
            {isLocating ? 'Locating...' : 'Locate My Farm'}
          </button>

          {detectedLocation && (
            <div className="flex items-center justify-center">
              <span className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {detectedLocation.name}
              </span>
            </div>
          )}
        </div>

        <button 
          onClick={handleStart}
          disabled={!farmerName.trim()}
          className="w-full flex items-center justify-center px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:shadow-md min-h-[56px]"
        >
          Start Farming
        </button>
      </div>
    </div>
  );
}
