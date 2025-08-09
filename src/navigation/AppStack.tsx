// src/navigation/AppStack.tsx

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import UserProfileScreen from '../screens/User/UserProfileScreen';
import OnboardingScreen from '../screens/Auth/OnboardingScreen';
import EditProfileScreen from '../screens/User/EditProfileScreen';
import PhotoUploadScreen from '../screens/User/PhotoUploadScreen';
import ViewUserProfileScreen from '../screens/User/ViewUserProfileScreen';
import SetHomeGymScreen from '../screens/User/SetHomeGymScreen';
import { RootStackParamList } from '../types';
import { ActivityIndicator, View } from 'react-native';
import MatchesScreen from '../screens/User/MatchesScreen';
import GymBuddiesScreen from '../screens/User/GymBuddiesScreen';
import ChatScreen from '../screens/User/ChatScreen';
import ScheduleWorkoutScreen from '../screens/User/ScheduleWorkoutScreen';
import ScheduledSessionsScreen from '../screens/User/ScheduledSessionsScreen';
import PendingInvitesScreen from '../screens/User/PendingInvitesScreen';
import ProgressFormScreen from '../screens/progress/ProgressFormScreen';
import ProgressChartScreen from '../screens/progress/ProgressChartScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import NavMenu from './NavMenu';

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
    <>
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
          <Stack.Screen
            name="SetHomeGym"
            component={SetHomeGymScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="Matches"
            component={MatchesScreen} // Assuming MatchesScreen is defined elsewhere
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="GymBuddies"
            component={GymBuddiesScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen 
            name="Chat"
            component={ChatScreen}
          />
          
          <Stack.Screen
            name="ScheduleWorkout"
            component={ScheduleWorkoutScreen}
          />

          <Stack.Screen
            name="PendingInvites"
            component={PendingInvitesScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="ScheduledSessions"
            component={ScheduledSessionsScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="ProgressForm"
            component={ProgressFormScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="ProgressChart"
            component={ProgressChartScreen}
            initialParams={{ id: userId }}
          />

          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            initialParams={{ id: userId }}
          />
      </Stack.Navigator>
      {/* Show hamburger only when logged in */}
      {userId !== null && <NavMenu userId={userId} />}
    </>
  );
};

export default AppStack;
