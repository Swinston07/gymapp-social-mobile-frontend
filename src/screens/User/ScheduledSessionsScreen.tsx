import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { getSessionsByStatus, updateSessionStatus } from '../../api/sessionApi';
import { createReview, getReviewsWrittenByUser } from '../../api/reviewApi';
import { markSectionSeen } from '../../api/unreadApi';
import { RootStackParamList } from '../../types';

type ScheduledSessionsRouteProp = RouteProp<RootStackParamList, 'ScheduledSessions'>;

type Session = {
  session_id: number;
  user1_id: number;
  user2_id: number;
  user1_first_name?: string;
  user1_last_name?: string;
  user2_first_name?: string;
  user2_last_name?: string;
  scheduled_time: string; // ISO string
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED';
};

type ReviewDraft = {
  rating: number | null;
  comment: string;
};

const ScheduledSessionsScreen = () => {
  const route = useRoute<ScheduledSessionsRouteProp>();
  const { id: currentUserId } = route.params;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reviewingSessionId, setReviewingSessionId] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState<ReviewDraft>({ rating: null, comment: '' });
  const [reviewedSessionIds, setReviewedSessionIds] = useState<Set<number>>(new Set());

  const fetchScheduledSessions = useCallback(async () => {
    try {
      const scheduled = await getSessionsByStatus(Number(currentUserId), 'SCHEDULED');
      const completed = await getSessionsByStatus(Number(currentUserId), 'COMPLETED');
      setSessions([...(scheduled || []), ...(completed || [])]);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
      setSessions([]);
    }
  }, [currentUserId]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchScheduledSessions();

      try {
        const written = await getReviewsWrittenByUser(Number(currentUserId));
        const ids = new Set<number>((written || []).map((r: any) => r.session_id));
        setReviewedSessionIds(ids);
      } catch (err) {
        console.error('Failed to fetch written reviews', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUserId, fetchScheduledSessions]);

  // 👇 Clear the "sessions" dot whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      markSectionSeen(Number(currentUserId), 'sessions').catch(() => {});
      fetchScheduledSessions();
    }, [currentUserId, fetchScheduledSessions])
  );

  const handleComplete = async (sessionId: number) => {
    try {
      const ok = await updateSessionStatus(sessionId, 'COMPLETED');
      if (ok) {
        setSessions(prev =>
          prev.map(s => (s.session_id === sessionId ? { ...s, status: 'COMPLETED' } : s))
        );
        setReviewingSessionId(sessionId);
        setMessage('Session marked as completed. Please leave a review!');
      }
    } catch (err) {
      console.error('Failed to mark as completed', err);
    }
  };

  const handleOpenReview = (sessionId: number) => {
    setReviewingSessionId(sessionId);
    setReviewData({ rating: null, comment: '' });
  };

  const handleSubmitReview = async (session: Session) => {
    const me = Number(currentUserId);
    const reviewedId = session.user1_id === me ? session.user2_id : session.user1_id;

    if (!reviewData.rating) {
      setMessage('Please select a rating before submitting.');
      return;
    }

    try {
      const ok = await createReview(me, {
        session_id: session.session_id,
        reviewed_id: reviewedId,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });

      if (ok) {
        setMessage('Review submitted!');
        setReviewingSessionId(null);
        setReviewedSessionIds(prev => {
          const copy = new Set(prev);
          copy.add(session.session_id);
          return copy;
        });
      } else {
        setMessage('Failed to submit review.');
      }
    } catch (err) {
      console.error('Failed to submit review', err);
      setMessage('Failed to submit review.');
    }
  };

  const renderStars = (current: number | null, onSelect: (n: number) => void) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onSelect(star)}>
          <Text style={[styles.star, current && current >= star ? styles.starActive : styles.starInactive]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Scheduled Sessions</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}

        {sessions.length === 0 ? (
          <Text style={styles.empty}>No scheduled sessions found.</Text>
        ) : (
          sessions.map(session => {
            const me = Number(currentUserId);
            const partnerName =
              session.user1_id === me
                ? `${session.user2_first_name ?? 'User'} ${session.user2_last_name ?? ''}`.trim()
                : `${session.user1_first_name ?? 'User'} ${session.user1_last_name ?? ''}`.trim();

            const canLeaveReview =
              session.status === 'COMPLETED' &&
              reviewingSessionId !== session.session_id &&
              !reviewedSessionIds.has(session.session_id);

            const isReviewOpen = reviewingSessionId === session.session_id;

            return (
              <View key={session.session_id} style={styles.card}>
                <Text style={styles.row}>
                  <Text style={styles.bold}>Workout with: </Text>
                  <Text style={styles.value}>{partnerName}</Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Scheduled Time: </Text>
                  <Text style={styles.value}>{new Date(session.scheduled_time).toLocaleString()}</Text>
                </Text>

                <Text style={styles.row}>
                  <Text style={styles.bold}>Status: </Text>
                  <Text style={styles.value}>{session.status}</Text>
                </Text>

                {session.status === 'SCHEDULED' && (
                  <TouchableOpacity
                    style={[styles.button, styles.primary]}
                    onPress={() => handleComplete(session.session_id)}
                  >
                    <Text style={styles.buttonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}

                {canLeaveReview && (
                  <View style={styles.completedRow}>
                    <Text style={styles.completedText}>Completed!</Text>
                    <TouchableOpacity onPress={() => handleOpenReview(session.session_id)}>
                      <Text style={styles.link}>Leave Review</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isReviewOpen && (
                  <View style={styles.reviewBox}>
                    <Text style={styles.reviewTitle}>Leave a Review</Text>

                    {renderStars(reviewData.rating, (n) =>
                      setReviewData(prev => ({ ...prev, rating: n }))
                    )}

                    <TextInput
                      style={styles.textarea}
                      multiline
                      numberOfLines={4}
                      placeholder="Write your review here..."
                      placeholderTextColor="#888"
                      value={reviewData.comment}
                      onChangeText={(t) => setReviewData(prev => ({ ...prev, comment: t }))}
                    />

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.button, styles.success, !reviewData.rating && styles.buttonDisabled]}
                        disabled={!reviewData.rating}
                        onPress={() => handleSubmitReview(session)}
                      >
                        <Text style={styles.buttonText}>Submit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.button, styles.secondary]}
                        onPress={() => setReviewingSessionId(null)}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ScheduledSessionsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    padding: 16,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    color: '#00E5A8',
    marginBottom: 10,
    textAlign: 'center',
  },
  empty: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderColor: '#333',
    borderWidth: 1,
  },
  row: {
    marginBottom: 6,
  },
  bold: {
    color: '#FFD700',
    fontWeight: '600',
  },
  value: {
    color: '#fff',
  },
  completedRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completedText: {
    color: '#ccc',
  },
  link: {
    color: '#00BFFF',
    textDecorationLine: 'underline',
  },
  reviewBox: {
    marginTop: 12,
    backgroundColor: '#222',
    borderRadius: 10,
    padding: 12,
    borderColor: '#444',
    borderWidth: 1,
  },
  reviewTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  star: {
    fontSize: 26,
    marginRight: 8,
  },
  starActive: {
    color: '#FFD700',
  },
  starInactive: {
    color: '#666',
  },
  textarea: {
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    borderColor: '#333',
    borderWidth: 1,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  primary: {
    backgroundColor: '#3B82F6', // blue
  },
  success: {
    backgroundColor: '#22C55E', // green
  },
  secondary: {
    backgroundColor: '#666',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
