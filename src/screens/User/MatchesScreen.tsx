// src/screens/User/MatchesScreen.tsx

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';

import { getFilteredMatches, getUserById } from '../../api/userApi';
import { getAverageRating } from '../../api/reviewApi';
import { getUserPhotos } from '../../api/photoApi';
import { sendWorkoutInvite } from '../../api/workoutInviteApi';
import { RootStackParamList } from '../../types';

type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  age: number;
  role: string;
  badges?: string[];
};

type MatchCardProps = {
  user: User;
  photoUrl?: string;
  rating?: string;
  onInvite: () => void;
  onDismiss: () => void;
  onViewProfile: () => void;
};

const MatchCard: React.FC<MatchCardProps> = ({
  user,
  photoUrl,
  rating,
  onInvite,
  onDismiss,
  onViewProfile,
}) => (
  <View style={styles.card}>
    {photoUrl ? (
      <Image source={{ uri: photoUrl }} style={styles.photo} />
    ) : (
      <View style={[styles.photo, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#888' }}>No photo</Text>
      </View>
    )}
    <Text style={styles.name}>
      {user.first_name} {user.last_name}
    </Text>
    <Text style={styles.info}>
      @{user.username} | {user.age} | {user.role}
    </Text>
    <Text style={styles.rating}>⭐ {rating ?? 'N/A'}</Text>

    {Array.isArray(user.badges) && user.badges.length > 0 && (
      <View style={styles.badgeContainer}>
        {user.badges.map((badge, i) => (
          <View key={`${badge}-${i}`} style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
      </View>
    )}

    <TouchableOpacity onPress={onViewProfile}>
      <Text style={styles.link}>View Profile</Text>
    </TouchableOpacity>

    <View style={styles.actions}>
      <TouchableOpacity onPress={onDismiss} style={styles.dismiss}>
        <Text style={styles.actionText}>❌</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onInvite} style={styles.invite}>
        <Text style={styles.actionText}>💪</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const MatchesScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: userId } = route.params;

  const [matches, setMatches] = useState<User[]>([]);
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [ratings, setRatings] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    min_age: '',
    max_age: '',
    experience_level: '', // ENUM values (BEGINNER, EXPERIENCED, ADVANCED, TRAINER, PROFESSIONAL)
    lifestyle: '',         // ENUM values (SEDENTARY, ACTIVE, VERY_ACTIVE, ATHLETE)
    consistency: '',       // ENUM values (ONCE_A_WEEK, TWICE_A_WEEK, THREE_PLUS_WEEK, RANDOM)
  });

  // Swiper control (single source of truth)
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef<Swiper<any>>(null);

  const getHiddenKey = () => `hiddenUsers_${userId}`;

  const fetchMatches = async () => {
    try {
      setLoading(true);

      // Optionally strip empty filters so backend only receives selected ones
      const payload = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '' && v != null)
      ) as any;

      const allMatches: User[] = await getFilteredMatches(userId, payload);
      const hidden = JSON.parse((await AsyncStorage.getItem(getHiddenKey())) || '[]') as number[];
      const visibleMatches = allMatches.filter((u) => !hidden.includes(u.id));
      setMatches(visibleMatches);
      setCurrentIndex(0); // reset deck to start

      // Pull photos/ratings
      const photoMap: Record<number, string> = {};
      const ratingMap: Record<number, string> = {};

      for (const u of visibleMatches) {
        try {
          const userPhotos = await getUserPhotos(u.id);
          if (Array.isArray(userPhotos) && userPhotos.length > 0) {
            photoMap[u.id] = userPhotos[0].image_url;
          }
        } catch {}

        try {
          const avg = await getAverageRating(u.id);
          if (avg !== null && avg !== undefined) ratingMap[u.id] = Number(avg).toFixed(1);
        } catch {}
      }

      setPhotos(photoMap);
      setRatings(ratingMap);
    } catch (err) {
      console.error('Failed to fetch matches', err);
    } finally {
      setLoading(false);
    }
  };

  const markUserAsHidden = async (targetId: number) => {
    const key = getHiddenKey();
    const hidden = JSON.parse((await AsyncStorage.getItem(key)) || '[]') as number[];
    if (!hidden.includes(targetId)) {
      hidden.push(targetId);
      await AsyncStorage.setItem(key, JSON.stringify(hidden));
    }
  };

  const onSwipedRight = async (i: number) => {
    const user = matches[i];
    if (!user) return;
    try {
      const response = await sendWorkoutInvite(userId, user.id);
      await markUserAsHidden(user.id);
      Alert.alert('Invite', response === 'Invite Accepted!' ? 'Found a Gym Buddy!' : 'Invite sent!');
    } catch {
      Alert.alert('Invite', 'Failed to send invite');
    } finally {
      setCurrentIndex(i + 1);
    }
  };

  const onSwipedLeft = async (i: number) => {
    const user = matches[i];
    if (!user) return;
    try {
      await markUserAsHidden(user.id);
    } finally {
      setCurrentIndex(i + 1);
    }
  };

  // 🔔 Prompt to set Home Gym if missing
  const checkHomeGymAndPrompt = useCallback(async () => {
    try {
      const me: any = await getUserById(userId);
      const hasHomeGym =
        (me?.home_gym_id != null && me.home_gym_id !== 0) ||
        (me?.homeGymId != null && me.homeGymId !== 0) ||
        !!me?.home_gym ||
        !!me?.homeGym ||
        (me?.home_gym_lat != null && me?.home_gym_lng != null);

      if (!hasHomeGym) {
        Alert.alert(
          'Set your home gym',
          'To get nearby matches, please set your home gym.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Set Now', onPress: () => navigation.navigate('SetHomeGym', { id: userId }) },
          ]
        );
      }
    } catch {
      // ignore
    }
  }, [userId, navigation]);

  useEffect(() => {
    fetchMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Check for Home Gym on focus
  useFocusEffect(
    useCallback(() => {
      checkHomeGymAndPrompt();
    }, [checkHomeGymAndPrompt])
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {matches.length > 0 && currentIndex < matches.length ? (
          <>
            {/* Filter Modal */}
            <Modal
              animationType="slide"
              transparent
              visible={filterModalVisible}
              onRequestClose={() => setFilterModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <ScrollView>
                    <Text style={styles.modalTitle}>Filter Matches</Text>

                    {/* Min/Max Age */}
                    <TextInput
                      placeholder="Min Age"
                      keyboardType="numeric"
                      style={styles.input}
                      placeholderTextColor="#999"
                      value={filters.min_age}
                      onChangeText={(text) => setFilters({ ...filters, min_age: text })}
                    />
                    <TextInput
                      placeholder="Max Age"
                      keyboardType="numeric"
                      style={styles.input}
                      placeholderTextColor="#999"
                      value={filters.max_age}
                      onChangeText={(text) => setFilters({ ...filters, max_age: text })}
                    />

                    {/* Experience Level (ENUM - matches Onboarding) */}
                    <Text style={styles.pickerLabel}>Experience Level</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={filters.experience_level}
                        onValueChange={(value: string) =>
                          setFilters((prev) => ({ ...prev, experience_level: value }))
                        }
                        style={styles.picker}
                        dropdownIconColor="#FFD700"
                      >
                        <Picker.Item label="Any" value="" />
                        <Picker.Item label="Beginner" value="BEGINNER" />
                        <Picker.Item label="Experienced" value="EXPERIENCED" />
                        <Picker.Item label="Advanced" value="ADVANCED" />
                        <Picker.Item label="Trainer" value="TRAINER" />
                        <Picker.Item label="Professional" value="PROFESSIONAL" />
                      </Picker>
                    </View>

                    {/* Lifestyle (ENUM - matches Onboarding) */}
                    <Text style={styles.pickerLabel}>Lifestyle</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={filters.lifestyle}
                        onValueChange={(value: string) =>
                          setFilters((prev) => ({ ...prev, lifestyle: value }))
                        }
                        style={styles.picker}
                        dropdownIconColor="#FFD700"
                      >
                        <Picker.Item label="Any" value="" />
                        <Picker.Item label="Sedentary" value="SEDENTARY" />
                        <Picker.Item label="Active" value="ACTIVE" />
                        <Picker.Item label="Very Active" value="VERY_ACTIVE" />
                        <Picker.Item label="Athlete" value="ATHLETE" />
                      </Picker>
                    </View>

                    {/* Consistency (ENUM - matches Onboarding) */}
                    <Text style={styles.pickerLabel}>Consistency</Text>
                    <View style={styles.pickerWrap}>
                      <Picker
                        selectedValue={filters.consistency}
                        onValueChange={(value: string) =>
                          setFilters((prev) => ({ ...prev, consistency: value }))
                        }
                        style={styles.picker}
                        dropdownIconColor="#FFD700"
                      >
                        <Picker.Item label="Any" value="" />
                        <Picker.Item label="Once/week" value="ONCE_A_WEEK" />
                        <Picker.Item label="Twice/week" value="TWICE_A_WEEK" />
                        <Picker.Item label="Three+/week" value="THREE_PLUS_WEEK" />
                        <Picker.Item label="Random" value="RANDOM" />
                      </Picker>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setFilterModalVisible(false);
                        fetchMatches(); // re-fetch with filters
                      }}
                      style={styles.applyButton}
                    >
                      <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Open Filters Button — LEFT so it doesn't collide with hamburger */}
            <TouchableOpacity
              onPress={() => setFilterModalVisible(true)}
              style={styles.filterButton}
            >
              <Text style={styles.filterButtonText}>Open Filters</Text>
            </TouchableOpacity>

            {/* Match Swiper */}
            <Swiper
              ref={swiperRef}
              cards={matches}
              cardIndex={currentIndex}
              renderCard={(user?: User) =>
                user ? (
                  <MatchCard
                    user={user}
                    photoUrl={photos[user.id]}
                    rating={ratings[user.id]}
                    onInvite={() => swiperRef.current?.swipeRight()}
                    onDismiss={() => swiperRef.current?.swipeLeft()}
                    onViewProfile={() =>
                      navigation.navigate('ViewUserProfile', { id: user.id })
                    }
                  />
                ) : (
                  <View style={[styles.card, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#999' }}>No card</Text>
                  </View>
                )
              }
              onSwipedRight={onSwipedRight}
              onSwipedLeft={onSwipedLeft}
              onSwiped={(i) => setCurrentIndex(i + 1)}
              backgroundColor="transparent"
              stackSize={3}
              verticalSwipe={false}
            />

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { id: userId })}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back to Profile</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noUsers}>No more matches available.</Text>
        )}
      </View>
    </SafeAreaView>
  );
};

export default MatchesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  photo: { width: '100%', aspectRatio: 4/5, height: 300, borderRadius: 16, marginBottom: 12 },
  name: { fontSize: 20, color: '#FFD700', fontWeight: 'bold' },
  info: { color: '#ccc', fontSize: 14 },
  rating: { color: '#FFD700', marginTop: 6 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  badge: {
    backgroundColor: '#FFD70022',
    borderColor: '#FFD700',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    margin: 2,
  },
  badgeText: { color: '#FFD700', fontSize: 12 },
  link: { color: '#00BFFF', marginTop: 10, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 20, marginTop: 16 },
  dismiss: { padding: 10, backgroundColor: '#ff5555', borderRadius: 40 },
  invite: { padding: 10, backgroundColor: '#00cc66', borderRadius: 40 },
  actionText: { fontSize: 20, color: '#fff' },
  noUsers: { color: '#fff', fontSize: 16, marginTop: 20 },
  backButton: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    zIndex: 10,
  },
  backButtonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 20, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  applyButton: {
    backgroundColor: '#FFD700',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  applyButtonText: { color: '#121212', fontWeight: 'bold' },
  cancelText: { color: '#ccc', textAlign: 'center', marginTop: 6 },
  // ⬅️ moved to the left to avoid the hamburger on the right
  filterButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FFD700',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    zIndex: 1000,
  },
  filterButtonText: { color: '#121212', fontWeight: 'bold' },

  // Picker styling
  pickerLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
  },
  pickerWrap: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    marginBottom: 10,
  },
  picker: {
    color: '#fff',
    width: '100%',
  },
});
