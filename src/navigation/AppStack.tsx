import React, { useEffect, useState } from 'react';
import { AppState, DeviceEventEmitter, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

import LoginScreen from '../screens/Auth/LoginScreen';
import UserProfileScreen from '../screens/User/UserProfileScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import EditProfileScreen from '../screens/User/EditProfileScreen';
import PhotoUploadScreen from '../screens/User/PhotoUploadScreen';
import ViewUserProfileScreen from '../screens/User/ViewUserProfileScreen';
import SetHomeGymScreen from '../screens/User/SetHomeGymScreen';
import MatchesScreen from '../screens/User/MatchesScreen';
import GymBuddiesScreen from '../screens/User/GymBuddiesScreen';
import ChatScreen from '../screens/User/ChatScreen';
import ScheduleWorkoutScreen from '../screens/User/ScheduleWorkoutScreen';
import ScheduledSessionsScreen from '../screens/User/ScheduledSessionsScreen';
import PendingInvitesScreen from '../screens/User/PendingInvitesScreen';
import ProgressFormScreen from '../screens/progress/ProgressFormScreen';
import ProgressChartScreen from '../screens/progress/ProgressChartScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import DeleteAccountScreen from '../screens/User/DeleteAccountScreen';
import NavMenu from './NavMenu';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppStack = () => {
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId ? Number(storedUserId) : null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const onLogin = DeviceEventEmitter.addListener('auth:login', async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId ? Number(storedUserId) : null);
    });
    const onLogout = DeviceEventEmitter.addListener('auth:logout', () => {
      setUserId(null);
    });
    const onAppState = AppState.addEventListener('change', async (s) => {
      if (s === 'active') {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId ? Number(storedUserId) : null);
      }
    });

    return () => {
      onLogin.remove();
      onLogout.remove();
      onAppState.remove();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  // ----- Auth stack -----
  if (userId === null) {
    return (
      <Stack.Navigator key="auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* If you use Register: <Stack.Screen name="Register" component={RegisterScreen} /> */}
      </Stack.Navigator>
    );
  }

  // ----- App stack -----
  return (
    <>
      <Stack.Navigator key="app" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="UserProfile" component={UserProfileScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="ViewUserProfile" component={ViewUserProfileScreen} />
        <Stack.Screen name="SetHomeGym" component={SetHomeGymScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="Matches" component={MatchesScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="GymBuddies" component={GymBuddiesScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ScheduleWorkout" component={ScheduleWorkoutScreen} />
        <Stack.Screen name="PendingInvites" component={PendingInvitesScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="ScheduledSessions" component={ScheduledSessionsScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="ProgressForm" component={ProgressFormScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="ProgressChart" component={ProgressChartScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} initialParams={{ id: userId }} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      </Stack.Navigator>

      <NavMenu userId={userId} />
    </>
  );
};

export default AppStack;
