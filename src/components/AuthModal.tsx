'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Loader2, KeyRound, User, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALLBACK_LAT = 23.0822;
const FALLBACK_LON = 88.5228;
const FALLBACK_NAME = 'Chakdaha, West Bengal';

export default function AuthModal() {
  const { isAuthenticated, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');

  const [farmerId, setFarmerId] = useState('');
  const [password, setPassword] = useState('');
  const [farmerName, setFarmerName] = useState('');
  
  const [isLocating, setIsLocating] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!farmerId.trim() || !password) {
        setErrorMsg('Please enter both ID and Password.');
        return;
      }
      const success = login(farmerId, password);
      if (!success) {
        setErrorMsg('Invalid ID or Password.');
      }
    } else {
      if (!farmerId.trim() || !password || !farmerName.trim()) {
        setErrorMsg('Please fill out all fields.');
        return;
      }
      const loc = detectedLocation || { lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME };
      const success = register(farmerId, password, farmerName, loc.lat, loc.lon, loc.name);
      if (!success) {
        setErrorMsg('Farmer ID already exists! Please choose another one.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-slate-100 my-8">
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-bold text-3xl text-slate-800 tracking-tight">
            MaatiKatha
          </h1>
          <p className="font-medium text-slate-500">
            {mode === 'login' ? 'Welcome back to your farm.' : 'Join the agricultural network.'}
          </p>
        </div>

        {/* Toggle Mode */}
        <div className="flex bg-slate-100 rounded-xl p-1 relative">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(''); }}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              mode === 'login' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(''); }}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-all",
              mode === 'register' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100 text-center">
              {errorMsg}
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Farmer ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder="e.g. ramesh123"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 mb-1.5 block">Farm Location</label>
              <button 
                type="button"
                onClick={handleLocate}
                disabled={isLocating}
                className={cn(
                  "w-full rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 border transition-all",
                  detectedLocation 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                {isLocating ? (
                  <Loader2 className="animate-spin w-5 h-5" />
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
                {isLocating 
                  ? 'Locating...' 
                  : detectedLocation 
                    ? 'Location Saved!' 
                    : 'Use GPS to Locate Farm'
                }
              </button>
              {detectedLocation && (
                <p className="text-xs text-emerald-600 font-medium text-center mt-2 px-2">
                  📍 {detectedLocation.name}
                </p>
              )}
            </div>
          )}

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-4 font-bold text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
