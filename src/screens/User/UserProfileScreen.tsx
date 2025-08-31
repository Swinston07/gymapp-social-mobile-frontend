import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp, useNavigation, useRoute, CommonActions, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUserById } from '../../api/userApi';
import { RootStackParamList } from '../../types';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

const isProfileIncomplete = (user: any) =>
  !user?.experience_level || !user?.lifestyle || !user?.consistency || !user?.about_me;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const UserProfileScreen = () => {
  const navigation = useNavigation<UserProfileNavProp>();
  const route = useRoute<UserProfileRouteProp>();

  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  const safeResetToLogin = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'userId', 'user']);
    DeviceEventEmitter.emit('auth:logout'); // tell AppStack to hide menu immediately
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  }, [navigation]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Resolve user id
      let uid: number | null = route.params?.id ?? null;
      if (!uid) {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) uid = Number(storedUserId);
      }
      if (!uid || Number.isNaN(uid)) {
        await safeResetToLogin();
        return;
      }

      // Require token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        await safeResetToLogin();
        return;
      }

      // Fetch with retry (cold start)
      let data: any;
      try {
        data = await getUserById(uid);
      } catch (e: any) {
        if (e?.message === 'UNAUTHORIZED') {
          await safeResetToLogin();
          return;
        }
        await sleep(800);
        data = await getUserById(uid);
      }

      setUser(data);

      const dismissedStatus = await AsyncStorage.getItem(`dismiss-onboarding-${uid}`);
      setDismissed(dismissedStatus === 'true');
    } catch (e: any) {
      console.error('UserProfile load error:', e);
      if (e?.message === 'UNAUTHORIZED') {
        await safeResetToLogin();
        return;
      }
      setError('Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.id, safeResetToLogin]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      return () => {};
    }, [])
  );

  useEffect(() => {
    const onChange = async (state: AppStateStatus) => {
      if (state === 'active') {
        try {
          await load();
        } catch {
          /* handled in load */
        }
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [load]);

  const dismissPrompt = async () => {
    if (!user?.id) return;
    setDismissed(true);
    await AsyncStorage.setItem(`dismiss-onboarding-${user.id}`, 'true');
  };

  const goToLoginManually = async () => {
    await safeResetToLogin();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={{ color: '#aaa', marginTop: 8 }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity style={styles.linkButton} onPress={goToLoginManually}>
            <Text style={styles.linkButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.error}>No user found.</Text>
          <TouchableOpacity style={styles.linkButton} onPress={goToLoginManually}>
            <Text style={styles.linkButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const id = Number(user.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {!dismissed && isProfileIncomplete(user) && (
          <View style={styles.prompt}>
            <Text style={styles.promptText}>Complete your profile for better gym buddy matching!</Text>
            <TouchableOpacity
              style={styles.promptButton}
              onPress={() => navigation.navigate('Onboarding', { id })}
            >
              <Text style={styles.promptButtonText}>Complete Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={dismissPrompt}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.title}>Welcome, {user.username}</Text>
        <Text style={styles.subtitle}>Your Journey in Motion</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your stats</Text>
          <Text style={styles.cardText}>Start Weight: {user.start_weight}</Text>
          <Text style={styles.cardText}>Start Body Fat %: {user.start_body_fat_percentage}%</Text>
          <Text style={styles.cardText}>Height: {user.feet}'{user.inches}</Text>

          <TouchableOpacity onPress={() => navigation.navigate('ViewUserProfile', { id })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>View Your Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { id })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('PhotoUpload', { id })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Upload Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('SetHomeGym', { id })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Set Home Gym</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Matches', { id })} style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Find Gym Buddies</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flexGrow: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#aaa',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardText: {
    color: '#fff',
    marginBottom: 6,
  },
  prompt: {
    backgroundColor: '#FFEB3B',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  promptText: {
    color: '#000',
    marginBottom: 8,
  },
  promptButton: {
    backgroundColor: '#FBC02D',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  promptButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dismissText: {
    textAlign: 'right',
    color: '#555',
    fontSize: 12,
  },
  error: {
    color: 'red',
    padding: 16,
  },
  loading: {
    color: '#fff',
    padding: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  linkButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  linkButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
