// src/screens/User/GymBuddiesScreen.tsx
import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { getGymBuddies } from '../../api/gymBuddiesApi';
import { getUnreadByPartner, markSectionSeen } from '../../api/unreadApi';
import { getUserPhotos } from '../../api/photoApi';

type Buddy = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
};

const GymBuddiesScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: userId } = route.params;

  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [unreadByPartner, setUnreadByPartner] = useState<Record<number, number>>({});
  const [photos, setPhotos] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [buddiesRes, unreadMap] = await Promise.all([
        getGymBuddies(userId),
        getUnreadByPartner(userId).catch(() => ({} as Record<number, number>)),
      ]);

      const safeBuddies: Buddy[] = Array.isArray(buddiesRes) ? buddiesRes : [];
      setBuddies(safeBuddies);
      setUnreadByPartner(unreadMap || {});

      // Load first photo per buddy in parallel (typed to avoid implicit any)
      const entries: Array<[number, string]> = await Promise.all(
        safeBuddies.map(async (b: Buddy): Promise<[number, string]> => {
          try {
            const userPhotos = await getUserPhotos(b.id);
            const url =
              Array.isArray(userPhotos) && userPhotos[0]?.image_url
                ? userPhotos[0].image_url
                : '';
            return [b.id, url];
          } catch {
            return [b.id, ''];
          }
        })
      );

      const map: Record<number, string> = {};
      for (const [id, url] of entries) map[id] = url;
      setPhotos(map);
    } catch (err) {
      console.error('GymBuddies load failed', err);
      setBuddies([]);
      setUnreadByPartner({});
      setPhotos({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When this screen is focused, refresh lists and clear the "buddies" section badge (if any)
  useFocusEffect(
    useCallback(() => {
      markSectionSeen(userId, 'buddies').catch(() => {});
      loadData();
    }, [userId, loadData])
  );

  const handleChatClick = (buddyId: number) => {
    // Optimistically clear this buddy’s unread dot locally
    setUnreadByPartner((prev) => ({ ...prev, [buddyId]: 0 }));
    navigation.navigate('Chat', { id: userId, buddyId });
  };

  const handleViewProfileClick = (buddyId: number) => {
    navigation.navigate('ViewUserProfile', { id: buddyId });
  };

  const handleScheduleClick = (buddyId: number) => {
    navigation.navigate('ScheduleWorkout', { id: userId, buddyId });
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 100 }} size="large" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>My Gym Buddies</Text>

        {buddies.length === 0 ? (
          <Text style={styles.noBuddies}>No Gym Buddies yet.</Text>
        ) : (
          buddies.map((buddy) => {
            const unread = unreadByPartner[buddy.id] || 0;
            const photoUrl = photos[buddy.id];
            return (
              <View key={buddy.id} style={styles.card}>
                {/* Header row with avatar + name/username */}
                <View style={styles.rowHeader}>
                  <Avatar uri={photoUrl} firstName={buddy.first_name} lastName={buddy.last_name} />
                  <View style={{ marginLeft: 12, flexShrink: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {buddy.first_name} {buddy.last_name}
                    </Text>
                    <Text style={styles.username} numberOfLines={1}>
                      @{buddy.username}
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleChatClick(buddy.id)}
                    accessibilityLabel="Open chat"
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.buttonText}>Chat</Text>
                      {unread > 0 && <View style={styles.inlineDot} />}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => handleViewProfileClick(buddy.id)}
                  >
                    <Text style={styles.buttonText}>View Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.button} onPress={() => handleScheduleClick(buddy.id)}>
                    <Text style={styles.buttonText}>Schedule Workout</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('UserProfile', { id: userId })}
        >
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GymBuddiesScreen;

/** Small avatar component with photo fallback to initials */
const Avatar = memo(
  ({ uri, firstName, lastName }: { uri?: string; firstName?: string; lastName?: string }) => {
    const initials =
      `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || 'U';
    if (uri) {
      return <Image source={{ uri }} style={styles.avatar} />;
    }
    return (
      <View style={[styles.avatar, styles.avatarFallback]}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 20, backgroundColor: '#121212', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 16 },
  noBuddies: { color: '#ccc', textAlign: 'center', marginTop: 20 },

  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderColor: '#333',
    borderWidth: 1,
  },

  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderColor: '#2f2f2f',
    borderWidth: 1,
    backgroundColor: '#222',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#eaeaea',
    fontWeight: '700',
    fontSize: 16,
  },

  name: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  username: { color: '#aaa' },

  buttonGroup: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  button: { backgroundColor: '#FFD700', padding: 10, borderRadius: 8 },
  secondaryButton: { backgroundColor: '#444', padding: 10, borderRadius: 8 },
  buttonText: { color: '#121212', fontWeight: 'bold' },

  backButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
    width: '100%',
  },
  backButtonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },

  // Tiny per-buddy unread dot shown only when unread > 0
  inlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#121212',
  },
});
