import React, { useEffect, useState, useCallback } from 'react';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { RootStackParamList } from '../../types';
import { getSessionsByStatus, updateSessionStatus } from '../../api/sessionApi';
import { markSectionSeen } from '../../api/unreadApi';

type PendingInvitesRouteProp = RouteProp<RootStackParamList, 'PendingInvites'>;

type Session = {
  session_id: number;
  user1_id: number; // sender
  user2_id: number; // receiver (current user)
  user1_first_name?: string;
  user1_last_name?: string;
  scheduled_time: string; // ISO
  status: 'PENDING' | 'SCHEDULED' | 'DECLINED' | 'COMPLETED';
};

const PendingInvitesScreen = () => {
  const route = useRoute<PendingInvitesRouteProp>();
  const { id: currentUserId } = route.params;

  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const loadPending = useCallback(async () => {
    try {
      const data = await getSessionsByStatus(Number(currentUserId), 'PENDING');
      const filtered: Session[] = (data || []).filter(
        (s: Session) => s.user2_id === Number(currentUserId)
      );
      setPendingSessions(filtered);
    } catch (err) {
      console.error('Failed to fetch pending invites', err);
      setPendingSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    setLoading(true);
    loadPending();
  }, [loadPending]);

  // 👇 Clear the "invites" dot whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      markSectionSeen(Number(currentUserId), 'invites').catch(() => {});
      loadPending();
    }, [currentUserId, loadPending])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPending();
  }, [loadPending]);

  const handleResponse = async (sessionId: number, action: 'accept' | 'decline') => {
    const newStatus = action === 'accept' ? 'SCHEDULED' : 'DECLINED';
    try {
      const ok = await updateSessionStatus(sessionId, newStatus);
      if (ok) {
        setMessage(`Session ${action}ed successfully.`);
        setPendingSessions(prev => prev.filter(s => s.session_id !== sessionId));
      } else {
        setMessage('Something went wrong.');
      }
    } catch (err) {
      console.error('Failed to update session status', err);
      setMessage('Something went wrong.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Pending Invites</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}

        {pendingSessions.length === 0 ? (
          <Text style={styles.empty}>No pending invites.</Text>
        ) : (
          pendingSessions.map(session => (
            <View key={session.session_id} style={styles.card}>
              <Text style={styles.row}>
                <Text style={styles.bold}>From: </Text>
                <Text style={styles.value}>
                  {session.user1_first_name ?? 'User'} {session.user1_last_name ?? ''}
                </Text>
              </Text>
              <Text style={styles.row}>
                <Text style={styles.bold}>Date: </Text>
                <Text style={styles.value}>
                  {new Date(session.scheduled_time).toLocaleString()}
                </Text>
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() => handleResponse(session.session_id, 'accept')}
                  style={[styles.button, styles.accept]}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleResponse(session.session_id, 'decline')}
                  style={[styles.button, styles.decline]}
                >
                  <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PendingInvitesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { padding: 16 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  message: { color: '#00E5A8', marginBottom: 10, textAlign: 'center' },
  empty: { color: '#ccc', textAlign: 'center', marginTop: 16 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderColor: '#333',
    borderWidth: 1,
  },
  row: { marginBottom: 6 },
  bold: { color: '#FFD700', fontWeight: '600' },
  value: { color: '#fff' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  accept: { backgroundColor: '#22C55E' },
  decline: { backgroundColor: '#EF4444' },
  buttonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center' },
});
