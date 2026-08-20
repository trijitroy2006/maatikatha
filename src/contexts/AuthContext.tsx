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

const STORAGE_KEY_USERS = 'mk_db_users';
const STORAGE_KEY_SESSION = 'mk_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [farmerId, setFarmerId] = useState<string>('');
  const [farmerName, setFarmerName] = useState<string>('');
  const [farmLocation, setFarmLocationState] = useState<FarmLocation>(DEFAULT_LOCATION);
  const [locationName, setLocationName] = useState<string>(DEFAULT_LOCATION_NAME);

  // Restore state from localStorage on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      if (session) {
        const parsedSession = JSON.parse(session) as { id: string };
        const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
        if (usersStr && parsedSession.id) {
          const users = JSON.parse(usersStr) as Record<string, UserRecord>;
          const user = users[parsedSession.id];
          if (user) {
            setFarmerId(user.id);
            setFarmerName(user.name);
            setFarmLocationState({ lat: user.lat, lon: user.lon });
            setLocationName(user.locationName);
            setIsAuthenticated(true);
          }
        }
      }
    } catch {
      // Corrupt localStorage - ignore and use defaults
    }
  }, []);

  const _saveSession = (user: UserRecord) => {
    setFarmerId(user.id);
    setFarmerName(user.name);
    setFarmLocationState({ lat: user.lat, lon: user.lon });
    setLocationName(user.locationName);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({ id: user.id }));
    } catch {}
  };

  const login = (id: string, pass: string): boolean => {
    try {
      const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
      if (!usersStr) return false;
      const users = JSON.parse(usersStr) as Record<string, UserRecord>;
      const user = users[id];
      if (user && user.pass === pass) {
        _saveSession(user);
        return true;
      }
    } catch {}
    return false;
  };

  const register = (id: string, pass: string, name: string, lat: number, lon: number, locName: string): boolean => {
    const trimmedId = id.trim();
    if (!trimmedId) return false;

    try {
      const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
      const users: Record<string, UserRecord> = usersStr ? JSON.parse(usersStr) : {};
      
      // Check if ID already exists
      if (users[trimmedId]) return false;

      const newUser: UserRecord = { id: trimmedId, pass, name: name.trim(), lat, lon, locationName: locName };
      users[trimmedId] = newUser;
      
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
      _saveSession(newUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setFarmerId('');
    setFarmerName('');
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch {}
  };

  const setFarmLocation = (lat: number, lon: number, name: string) => {
    setFarmLocationState({ lat, lon });
    setLocationName(name);
    
    // Update the DB if authenticated
    if (isAuthenticated && farmerId) {
      try {
        const usersStr = localStorage.getItem(STORAGE_KEY_USERS);
        if (usersStr) {
          const users = JSON.parse(usersStr) as Record<string, UserRecord>;
          if (users[farmerId]) {
            users[farmerId].lat = lat;
            users[farmerId].lon = lon;
            users[farmerId].locationName = name;
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
          }
        }
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        farmerId,
        farmerName,
        farmLocation,
        locationName,
        login,
        register,
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
