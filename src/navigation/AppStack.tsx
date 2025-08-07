// src/navigation/AppStack.tsx

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfileScreen from '../screens/User/UserProfileScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import EditProfileScreen from '../screens/User/EditProfileScreen';
import PhotoUploadScreen from '../screens/User/PhotoUploadScreen';
import ViewUserProfileScreen from '../screens/User/ViewUserProfileScreen';
import { RootStackParamList } from '../types';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : null;
        setUserId(parsed?.id || null);
      } catch (err) {
        console.error("Error loading user:", err);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  if (loading || userId === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            initialParams={{ id: userId }}
        />
        <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            initialParams={{ id: userId }}
        />
        <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
        />
        <Stack.Screen
          name="PhotoUpload"
          component={PhotoUploadScreen}
          initialParams={{ id: userId }}
        />
        <Stack.Screen 
          name="ViewUserProfile" 
          component={ViewUserProfileScreen} 
        />

    </Stack.Navigator>
  );
};

export default AppStack;
