// src/screens/User/MatchesScreen.tsx

import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getFilteredMatches } from '../../api/userApi';
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
  photoUrl: string | null;
  rating: string | null;
  onInvite: () => void;
  onDismiss: () => void;
  onViewProfile: () => void;
};

const MatchCard: React.FC<MatchCardProps> = ({ user, photoUrl, rating, onInvite, onDismiss, onViewProfile }) => (
  <View style={styles.card}>
    {photoUrl && <Image source={{ uri: photoUrl }} style={styles.photo} />}
    <Text style={styles.name}>{user.first_name} {user.last_name}</Text>
    <Text style={styles.info}>@{user.username} | {user.age} | {user.role}</Text>
    <Text style={styles.rating}>⭐ {rating ?? 'N/A'}</Text>
    {Array.isArray(user.badges) && user.badges.length > 0 && (
      <View style={styles.badgeContainer}>
        {user.badges.map((badge, i) => (
          <View key={i} style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
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
  const [photos, setPhotos] = useState<{ [key: number]: string }>({});
  const [ratings, setRatings] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    min_age: '',
    max_age: '',
    experience_level: '',
    lifestyle: '',
    consistency: '',
  });

  const getHiddenKey = () => `hiddenUsers_${userId}`;

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const allMatches = await getFilteredMatches(userId, filters);
      const hidden = JSON.parse(await AsyncStorage.getItem(getHiddenKey()) || '[]');
      const visibleMatches = allMatches.filter((u: User) => !hidden.includes(u.id));
      setMatches(visibleMatches);

      const photoMap: Record<number, string> = {};
      const ratingMap: Record<number, string> = {};
      for (const user of visibleMatches) {
        const userPhotos = await getUserPhotos(user.id);
        if (userPhotos.length > 0) photoMap[user.id] = userPhotos[0].image_url;

        const avg = await getAverageRating(user.id);
        if (avg !== null) ratingMap[user.id] = avg.toFixed(1);
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
    const hidden = JSON.parse(await AsyncStorage.getItem(key) || '[]');
    if (!hidden.includes(targetId)) {
      hidden.push(targetId);
      await AsyncStorage.setItem(key, JSON.stringify(hidden));
    }
  };

  const handleInvite = async (targetId: number) => {
    try {
      const response = await sendWorkoutInvite(userId, targetId);
      await markUserAsHidden(targetId);
      alert(response === 'Invite Accepted!' ? 'Found a Gym Buddy!' : 'Invite sent!');
    } catch {
      alert('Failed to send invite');
    }
  };

  const handleDismiss = async (targetId: number) => {
    await markUserAsHidden(targetId);
  };

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
        {matches.length > 0 ? (
            <>
            {/* ✅ Filter Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => setFilterModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <ScrollView>
                    <Text style={styles.modalTitle}>Filter Matches</Text>

                    <TextInput
                        placeholder="Role (e.g., trainer, client)"
                        style={styles.input}
                        placeholderTextColor="#999"
                        value={filters.role}
                        onChangeText={(text) => setFilters({ ...filters, role: text })}
                    />
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
                    <TextInput
                        placeholder="Experience Level"
                        style={styles.input}
                        placeholderTextColor="#999"
                        value={filters.experience_level}
                        onChangeText={(text) => setFilters({ ...filters, experience_level: text })}
                    />
                    <TextInput
                        placeholder="Lifestyle"
                        style={styles.input}
                        placeholderTextColor="#999"
                        value={filters.lifestyle}
                        onChangeText={(text) => setFilters({ ...filters, lifestyle: text })}
                    />
                    <TextInput
                        placeholder="Consistency"
                        style={styles.input}
                        placeholderTextColor="#999"
                        value={filters.consistency}
                        onChangeText={(text) => setFilters({ ...filters, consistency: text })}
                    />

                    <TouchableOpacity
                        onPress={() => {
                        setFilterModalVisible(false);
                        fetchMatches(); // Re-fetch using updated filters
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

            {/* ✅ Open Filters Button - floats above */}
            <TouchableOpacity
                onPress={() => setFilterModalVisible(true)}
                style={styles.filterButton}
            >
                <Text style={styles.filterButtonText}>Open Filters</Text>
            </TouchableOpacity>

            {/* ✅ Match Swiper */}
            <Swiper
                cards={matches}
                renderCard={(user: User) => (
                <MatchCard
                    user={user}
                    photoUrl={photos[user.id]}
                    rating={ratings[user.id]}
                    onInvite={() => handleInvite(user.id)}
                    onDismiss={() => handleDismiss(user.id)}
                    onViewProfile={() => navigation.navigate('ViewUserProfile', { id: user.id })}
                />
                )}
                onSwiped={(i) => setMatches((prev) => prev.filter((_, index) => index !== i))}
                cardIndex={0}
                backgroundColor="transparent"
                stackSize={3}
                verticalSwipe={false}
            />

            {/* ✅ Back Button */}
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
  card: { backgroundColor: '#1e1e1e', borderRadius: 20, padding: 16, alignItems: 'center', width: '100%' },
  photo: { width: '100%', height: 300, borderRadius: 16, marginBottom: 12 },
  name: { fontSize: 20, color: '#FFD700', fontWeight: 'bold' },
  info: { color: '#ccc', fontSize: 14 },
  rating: { color: '#FFD700', marginTop: 6 },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 6 },
  badge: { backgroundColor: '#FFD70022', borderColor: '#FFD700', borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 2 },
  badgeText: { color: '#FFD700', fontSize: 12 },
  link: { color: '#00BFFF', marginTop: 10, textDecorationLine: 'underline' },
  actions: { flexDirection: 'row', gap: 20, marginTop: 16 },
  dismiss: { padding: 10, backgroundColor: '#ff5555', borderRadius: 40 },
  invite: { padding: 10, backgroundColor: '#00cc66', borderRadius: 40 },
  actionText: { fontSize: 20, color: '#fff' },
  noUsers: { color: '#fff', fontSize: 16, marginTop: 20 },
  backButton: { position: 'absolute', bottom: 150, left: 20, right: 20, backgroundColor: '#FFD700', padding: 14, borderRadius: 10, zIndex: 10 },
  backButtonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 20, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginBottom: 10 },
  input: { backgroundColor: '#2a2a2a', color: '#fff', padding: 10, borderRadius: 8, marginBottom: 10 },
  applyButton: { backgroundColor: '#FFD700', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  applyButtonText: { color: '#121212', fontWeight: 'bold' },
  cancelText: { color: '#ccc', textAlign: 'center', marginTop: 6 },
  filterButton: { position: 'absolute', top: 20, right: 20, backgroundColor: '#FFD700', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, zIndex: 1000 },
  filterButtonText: { color: '#121212', fontWeight: 'bold' },
});
