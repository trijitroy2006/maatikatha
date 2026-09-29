'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Loader2, KeyRound, User, Leaf, PenLine, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

const FALLBACK_LAT  = 23.0822;
const FALLBACK_LON  = 88.5228;
const FALLBACK_NAME = 'Chakdaha, West Bengal';

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman & Nicobar Islands','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export default function AuthModal() {
  const { isAuthenticated, isLoading, login, register } = useAuth();

  const [mode, setMode]           = useState<'login' | 'register'>('login');
  const [farmerId, setFarmerId]   = useState('');
  const [password, setPassword]   = useState('');
  const [farmerName, setFarmerName] = useState('');

  // Location mode: 'none' | 'gps' | 'manual'
  const [locationMode, setLocationMode] = useState<'none' | 'gps' | 'manual'>('none');

  // GPS state
  const [isLocating, setIsLocating]     = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{
    lat: number; lon: number; name: string;
  } | null>(null);

  // Manual state
  const [manualVillage,  setManualVillage]  = useState('');
  const [manualDistrict, setManualDistrict] = useState('');
  const [manualState,    setManualState]    = useState('West Bengal');
  const [manualPinCode,  setManualPinCode]  = useState('');

  const [errorMsg, setErrorMsg] = useState('');

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center animate-pulse">
          <Leaf className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="text-slate-500 font-medium text-sm">Loading your farm…</p>
      </div>
    );
  }

  if (isAuthenticated) return null;

  // ── GPS locate ──────────────────────────────────────────────────────────────
  const handleLocate = () => {
    setIsLocating(true);
    setDetectedLocation(null);
    if (!navigator.geolocation) {
      setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          setDetectedLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            name: data.display_name || FALLBACK_NAME,
          });
        } catch {
          setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
        } finally { setIsLocating(false); }
      },
      () => {
        setDetectedLocation({ lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME });
        setIsLocating(false);
      }
    );
  };

  // ── Build location from manual fields ──────────────────────────────────────
  const buildManualLocation = () => {
    const parts = [manualVillage.trim(), manualDistrict.trim(), manualState.trim(), manualPinCode.trim()]
      .filter(Boolean);
    const name = parts.join(', ') || FALLBACK_NAME;
    // Use state-level centroid coords as approximate lat/lon for manual entry
    const STATE_COORDS: Record<string, [number, number]> = {
      'West Bengal': [22.9868, 87.8550], 'Bihar': [25.0961, 85.3131],
      'Uttar Pradesh': [26.8467, 80.9462], 'Punjab': [31.1471, 75.3412],
      'Haryana': [29.0588, 76.0856], 'Maharashtra': [19.7515, 75.7139],
      'Madhya Pradesh': [22.9734, 78.6569], 'Gujarat': [22.2587, 71.1924],
      'Rajasthan': [27.0238, 74.2179], 'Karnataka': [15.3173, 75.7139],
      'Tamil Nadu': [11.1271, 78.6569], 'Andhra Pradesh': [15.9129, 79.7400],
      'Odisha': [20.9517, 85.0985], 'Assam': [26.2006, 92.9376],
      'Jharkhand': [23.6102, 85.2799], 'Chhattisgarh': [21.2787, 81.8661],
    };
    const [lat, lon] = STATE_COORDS[manualState] ?? [FALLBACK_LAT, FALLBACK_LON];
    return { lat, lon, name };
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!farmerId.trim() || !password) {
        setErrorMsg('Please enter your Farmer ID and Password.');
        return;
      }
      if (!login(farmerId.trim(), password)) {
        setErrorMsg('Incorrect Farmer ID or Password. Try again.');
      }
      return;
    }

    // Register
    if (!farmerId.trim() || !password || !farmerName.trim()) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    // Resolve location
    let loc = { lat: FALLBACK_LAT, lon: FALLBACK_LON, name: FALLBACK_NAME };
    if (locationMode === 'gps' && detectedLocation) {
      loc = detectedLocation;
    } else if (locationMode === 'manual') {
      if (!manualDistrict.trim() || !manualState.trim()) {
        setErrorMsg('Please enter at least District and State for your farm location.');
        return;
      }
      loc = buildManualLocation();
    }

    if (!register(farmerId.trim(), password, farmerName.trim(), loc.lat, loc.lon, loc.name)) {
      setErrorMsg('That Farmer ID is already taken. Please choose another.');
    }
  };

  const resetMode = (m: 'login' | 'register') => {
    setMode(m);
    setErrorMsg('');
    setLocationMode('none');
    setDetectedLocation(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6 border border-slate-100 my-8">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="font-bold text-3xl text-slate-800 tracking-tight">MaatiKatha</h1>
          <p className="font-medium text-slate-500">
            {mode === 'login' ? 'Welcome back! Log in to your farm.' : 'Create your farmer account.'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => resetMode(m)}
              className={cn(
                'flex-1 py-2 text-sm font-semibold rounded-lg transition-all capitalize',
                mode === m
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {m === 'login' ? 'Log In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm font-medium border border-rose-100 text-center">
              {errorMsg}
            </div>
          )}

          {/* Full Name — register only */}
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={farmerName}
                  onChange={e => setFarmerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* Farmer ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Farmer ID</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={farmerId}
                onChange={e => setFarmerId(e.target.value)}
                placeholder="e.g. ramesh123"
                autoComplete="username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* ── Farm Location (register only) ─────────────────────────────── */}
          {mode === 'register' && (
            <div className="space-y-3 pt-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 block">
                Farm Location <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>

              {/* GPS / Manual toggle buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode('gps');
                    setDetectedLocation(null);
                    handleLocate();
                  }}
                  className={cn(
                    'rounded-xl py-3 px-3 font-semibold text-sm flex items-center justify-center gap-2 border transition-all',
                    locationMode === 'gps'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  )}
                >
                  {isLocating && locationMode === 'gps'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Navigation className="w-4 h-4" />
                  }
                  {isLocating && locationMode === 'gps' ? 'Locating…' : 'Use GPS'}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationMode(prev => prev === 'manual' ? 'none' : 'manual')}
                  className={cn(
                    'rounded-xl py-3 px-3 font-semibold text-sm flex items-center justify-center gap-2 border transition-all',
                    locationMode === 'manual'
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  )}
                >
                  <PenLine className="w-4 h-4" />
                  Enter Manually
                </button>
              </div>

              {/* GPS result */}
              {locationMode === 'gps' && detectedLocation && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-700">GPS Location Saved ✓</p>
                    <p className="text-xs text-emerald-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {detectedLocation.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Manual entry form */}
              {locationMode === 'manual' && (
                <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" /> Enter your farm location manually
                  </p>

                  {/* Village / Town */}
                  <div>
                    <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">
                      Village / Town
                    </label>
                    <input
                      type="text"
                      value={manualVillage}
                      onChange={e => setManualVillage(e.target.value)}
                      placeholder="e.g. Krishnapur"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>

                  {/* District */}
                  <div>
                    <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">
                      District <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={manualDistrict}
                      onChange={e => setManualDistrict(e.target.value)}
                      placeholder="e.g. Nadia"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>

                  {/* State dropdown */}
                  <div>
                    <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={manualState}
                      onChange={e => setManualState(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer"
                    >
                      {INDIAN_STATES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pin Code */}
                  <div>
                    <label className="text-xs text-slate-500 font-medium ml-1 mb-1 block">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={manualPinCode}
                      onChange={e => setManualPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 741222"
                      maxLength={6}
                      inputMode="numeric"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-slate-800 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all"
                    />
                  </div>

                  {/* Preview */}
                  {(manualVillage || manualDistrict) && (
                    <div className="flex items-center gap-2 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-blue-700 font-medium">
                        {[manualVillage, manualDistrict, manualState, manualPinCode]
                          .filter(Boolean).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl py-4 font-bold text-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {mode === 'login' ? '🌾 Log In' : '🌱 Create Account'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400 font-medium pt-1">
            {mode === 'login'
              ? "Don't have an account? Switch to Register above."
              : 'Already registered? Switch to Log In above.'}
          </p>

        </form>
      </div>
    </div>
  );
}
