'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FarmLocation {
  lat: number;
  lon: number;
}

export interface UserRecord {
  id: string;
  pass: string;
  name: string;
  lat: number;
  lon: number;
  locationName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;       // true while restoring session from storage
  farmerId: string;
  farmerName: string;
  farmLocation: FarmLocation;
  locationName: string;
  login: (id: string, pass: string) => boolean;
  register: (id: string, pass: string, name: string, lat: number, lon: number, locName: string) => boolean;
  logout: () => void;
  setFarmLocation: (lat: number, lon: number, name: string) => void;
}

const DEFAULT_LOCATION: FarmLocation = { lat: 23.0822, lon: 88.5228 };
const DEFAULT_LOCATION_NAME = 'Chakdaha, West Bengal';

const STORAGE_KEY_USERS   = 'mk_db_users';
const STORAGE_KEY_SESSION = 'mk_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]             = useState(true);   // start true — we haven't checked storage yet
  const [farmerId, setFarmerId]               = useState('');
  const [farmerName, setFarmerName]           = useState('');
  const [farmLocation, setFarmLocationState]  = useState<FarmLocation>(DEFAULT_LOCATION);
  const [locationName, setLocationName]       = useState(DEFAULT_LOCATION_NAME);

  // ── Restore session from localStorage on first mount ──────────────────────
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem(STORAGE_KEY_SESSION);
      const usersStr   = localStorage.getItem(STORAGE_KEY_USERS);

      if (sessionStr && usersStr) {
        const session = JSON.parse(sessionStr) as { id: string };
        const users   = JSON.parse(usersStr)   as Record<string, UserRecord>;
        const user    = users[session.id];

        if (user) {
          setFarmerId(user.id);
          setFarmerName(user.name);
          setFarmLocationState({ lat: user.lat, lon: user.lon });
          setLocationName(user.locationName);
          setIsAuthenticated(true);
        }
      }
    } catch {
      // corrupt storage — start fresh
    } finally {
      setIsLoading(false);  // done checking — hide the splash screen
    }
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const _applyUser = (user: UserRecord) => {
    setFarmerId(user.id);
    setFarmerName(user.name);
    setFarmLocationState({ lat: user.lat, lon: user.lon });
    setLocationName(user.locationName);
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({ id: user.id }));
  };

  const _readUsers = (): Record<string, UserRecord> => {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? (JSON.parse(raw) as Record<string, UserRecord>) : {};
  };

  const _writeUsers = (users: Record<string, UserRecord>) => {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  const login = (id: string, pass: string): boolean => {
    try {
      const users = _readUsers();
      const user  = users[id.trim()];
      if (user && user.pass === pass) {
        _applyUser(user);
        return true;
      }
    } catch { /* ignore */ }
    return false;
  };

  const register = (
    id: string, pass: string, name: string,
    lat: number, lon: number, locName: string
  ): boolean => {
    const trimId = id.trim();
    if (!trimId) return false;
    try {
      const users = _readUsers();
      if (users[trimId]) return false;   // ID already taken

      const newUser: UserRecord = {
        id: trimId, pass, name: name.trim(),
        lat, lon, locationName: locName,
      };
      users[trimId] = newUser;
      _writeUsers(users);
      _applyUser(newUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setFarmerId('');
    setFarmerName('');
    setFarmLocationState(DEFAULT_LOCATION);
    setLocationName(DEFAULT_LOCATION_NAME);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    // Note: we keep mk_db_users so the farmer can log back in without re-registering
  };

  const setFarmLocation = (lat: number, lon: number, name: string) => {
    setFarmLocationState({ lat, lon });
    setLocationName(name);

    if (isAuthenticated && farmerId) {
      try {
        const users = _readUsers();
        if (users[farmerId]) {
          users[farmerId].lat          = lat;
          users[farmerId].lon          = lon;
          users[farmerId].locationName = name;
          _writeUsers(users);
        }
      } catch { /* ignore */ }
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading,
      farmerId, farmerName, farmLocation, locationName,
      login, register, logout, setFarmLocation,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
