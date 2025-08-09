// App.tsx

import React, { useEffect } from 'react';
import AuthWrapper from './src/navigation/AuthWrapper';
import { AuthProvider } from './src/AuthContext/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  useEffect(() => {
    // ✅ DEV ONLY: Clear saved login on app launch
    if (__DEV__) {
      AsyncStorage.removeItem('user');
      AsyncStorage.removeItem('token');
      console.log('[DEV] Cleared stored user/token');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
