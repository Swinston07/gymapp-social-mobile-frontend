// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Strongly typed User shape used on the frontend (only what you need)
export type User = {
  id: number;
  username: string;
  email: string;

  first_name?: string;
  last_name?: string;
  age?: number;

  start_weight?: number;
  start_body_fat_percentage?: number;
  current_weight?: number;
  current_body_fat_percentage?: number;

  created_on?: string; // ISO string; parse to Date only if you need it

  home_gym?: string;
  is_working_out?: boolean;

  latitude?: number | null;   // often nullable in APIs
  longitude?: number | null;  // often nullable in APIs

  about_me?: string;
  experience_level?: string;
  lifestyle?: string;
  consistency?: string;

  is_premium?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (err) {
        console.error('Error loading stored user:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (u: User, token: string) => {
    await AsyncStorage.setItem('user', JSON.stringify(u));
    await AsyncStorage.setItem('token', token);
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['user', 'token']);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Optional convenience hook
export const useAuth = () => useContext(AuthContext);
