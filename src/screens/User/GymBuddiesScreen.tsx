// src/screens/User/GymBuddiesScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { getGymBuddies } from '../../api/gymBuddiesApi';
import { getUnreadByPartner, markSectionSeen } from '../../api/unreadApi';

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
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [buddiesRes, unreadMap] = await Promise.all([
        getGymBuddies(userId),
        getUnreadByPartner(userId).catch(() => ({} as Record<number, number>)),
      ]);

      setBuddies(buddiesRes);

      const hasUnread = unreadMap && Object.keys(unreadMap).length > 0;

      // TEMP (for visual testing): if backend returns no unread, force a dot on the first buddy.
      const fallback: Record<number, number> = {};
      if (!hasUnread && buddiesRes?.[0]) {
        fallback[buddiesRes[0].id] = 1;
      }

      setUnreadByPartner(hasUnread ? unreadMap : fallback);
    } catch (err) {
      console.error('GymBuddies load failed', err);
      setBuddies([]);
      setUnreadByPartner({});
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // mark section seen + refresh when focused
  useFocusEffect(
    useCallback(() => {
      markSectionSeen(userId, 'buddies').catch(() => {});
      loadData();
    }, [userId, loadData])
  );

  const handleChatClick = (buddyId: number) => {
    // optimistic clear for this buddy’s dot
    setUnreadByPartner(prev => ({ ...prev, [buddyId]: 0 }));
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
            return (
              <View key={buddy.id} style={styles.card}>
                <Text style={styles.name}>{buddy.first_name} {buddy.last_name}</Text>
                <Text style={styles.username}>@{buddy.username}</Text>

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

                  <TouchableOpacity
                    style={styles.button}
                    onPress={() => handleScheduleClick(buddy.id)}
                  >
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
          <Text style={styles.backButtonText}>Back to Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GymBuddiesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 20, backgroundColor: '#121212', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginBottom: 16 },
  noBuddies: { color: '#ccc', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#1e1e1e', padding: 16, borderRadius: 10,
    marginBottom: 16, borderColor: '#333', borderWidth: 1,
  },
  name: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  username: { color: '#aaa', marginBottom: 8 },
  buttonGroup: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 10 },
  button: { backgroundColor: '#FFD700', padding: 10, borderRadius: 8 },
  secondaryButton: { backgroundColor: '#444', padding: 10, borderRadius: 8 },
  buttonText: { color: '#121212', fontWeight: 'bold' },
  backButton: {
    backgroundColor: '#FFD700', padding: 14, borderRadius: 10,
    marginTop: 20, alignSelf: 'center', width: '100%',
  },
  backButtonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
  // tiny per-buddy unread dot rendered inline to the right of "Chat"
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
