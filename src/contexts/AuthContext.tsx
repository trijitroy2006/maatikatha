'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FarmLocation {
  lat: number;
  lon: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  farmerName: string;
  farmLocation: FarmLocation;
  locationName: string;
  login: (name: string) => void;
  logout: () => void;
  setFarmLocation: (lat: number, lon: number, name: string) => void;
}

const DEFAULT_LOCATION: FarmLocation = { lat: 23.0822, lon: 88.5228 };
const DEFAULT_LOCATION_NAME = 'Chakdaha, West Bengal';

const STORAGE_KEY_FARMER = 'mk_farmer';
const STORAGE_KEY_LOCATION = 'mk_location';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface StoredLocation {
  lat: number;
  lon: number;
  name: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [farmerName, setFarmerName] = useState<string>('');
  const [farmLocation, setFarmLocationState] = useState<FarmLocation>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const storedFarmer = localStorage.getItem(STORAGE_KEY_FARMER);
      if (storedFarmer) {
        const parsed = JSON.parse(storedFarmer) as { name: string };
        if (parsed.name && parsed.name.trim().length > 0) {
          setFarmerName(parsed.name.trim());
          setIsAuthenticated(true);
        }
      }

      const storedLocation = localStorage.getItem(STORAGE_KEY_LOCATION);
      if (storedLocation) {
        const parsed = JSON.parse(storedLocation) as StoredLocation;
        if (
          typeof parsed.lat === 'number' &&
          typeof parsed.lon === 'number' &&
          typeof parsed.name === 'string'
        ) {
          setFarmLocationState({ lat: parsed.lat, lon: parsed.lon });
          setLocationName(parsed.name);
        }
      }
    } catch {
      // Corrupt localStorage ignore and use defaults
    }
  }, []);

  const login = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFarmerName(trimmed);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY_FARMER, JSON.stringify({ name: trimmed }));
    } catch {
      // localStorage may be unavailable in some environments
    }
  };

  const logout = () => {
    setFarmerName('');
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_FARMER);
    } catch {
      // ignore
    }
  };

  const setFarmLocation = (lat: number, lon: number, name: string) => {
    setFarmLocationState({ lat, lon });
    setLocationName(name);
    try {
      localStorage.setItem(
        STORAGE_KEY_LOCATION,
        JSON.stringify({ lat, lon, name })
      );
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        farmerName,
        farmLocation,
        locationName,
        login,
        logout,
        setFarmLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
