// src/screens/User/ViewUserProfileScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { getUserById } from '../../api/userApi';
import { getUserPhotos, uploadPhoto, deletePhoto } from '../../api/photoApi';
import { getAverageRating, getReviewsByUser } from '../../api/reviewApi';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from '../../AuthContext/AuthContext';

type ViewUserProfileRouteProp = RouteProp<RootStackParamList, 'ViewUserProfile'>;

type Photo = {
  photo_id: number;
  user_id: number;
  image_url: string;
  uploaded_at?: string;
};

type Review = {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

const CROPPED_ASPECT: [number, number] = [4, 5];
const PREVIEW_WIDTH = 1080;

const ViewUserProfileScreen = () => {
  const route = useRoute<ViewUserProfileRouteProp>();
  const { id } = route.params;

  const { user: me } = useAuth();
  const isOwnProfile = useMemo(() => !!me && me.id === id, [me, id]);

  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rating, setRating] = useState<string | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Fullscreen preview state
  const [preview, setPreview] = useState<{ photoId: number; uri: string } | null>(null);
  const closePreview = () => setPreview(null);

  const refreshPhotos = async () => {
    const userPhotos = await getUserPhotos(id);
    setPhotos(Array.isArray(userPhotos) ? userPhotos : []);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userData = await getUserById(id);
      setUser(userData);

      await refreshPhotos();

      const avg = await getAverageRating(id);
      if (avg !== null && avg !== undefined) setRating(Number(avg).toFixed(1));

      const reviews = await getReviewsByUser(id);
      setRecentReviews((reviews || []).slice(0, 5));
    } catch (err) {
      console.error('Failed to load user profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onOpenPreview = (p: Photo) => {
    if (!p?.image_url) return;
    setPreview({ photoId: p.photo_id, uri: p.image_url });
  };

  // --- Actions inside preview (own profile only) --- //
  const handleDelete = () => {
    if (!preview) return;
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto(id, preview.photoId);
            await refreshPhotos();
            closePreview();
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to delete photo.');
          }
        },
      },
    ]);
  };

  const handleReplace = async () => {
    if (!preview) return;

    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: CROPPED_ASPECT,
      quality: 1,
      exif: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const srcUri = result.assets[0].uri;
    const manipulated = await ImageManipulator.manipulateAsync(
      srcUri,
      [{ resize: { width: PREVIEW_WIDTH } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    try {
      await deletePhoto(id, preview.photoId);

      const form = new FormData();
      form.append('image', {
        uri: manipulated.uri,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      await uploadPhoto(id, form);
      await refreshPhotos();
      closePreview();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to replace photo.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ padding: 20 }}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.loading}>Failed to load user.</Text>
      </SafeAreaView>
    );
  }

  // --- Compute badges on the client ---
  const computedBadges: string[] = [];

  if (user.role?.toLowerCase() === 'trainer') {
    computedBadges.push('🏋️ Trainer');
  }

  switch (user.experience_level) {
    case 'BEGINNER': computedBadges.push('🌱 Beginner'); break;
    case 'EXPERIENCED': computedBadges.push('🔵 Experienced'); break;
    case 'ADVANCED': computedBadges.push('🏆 Advanced'); break;
    case 'TRAINER': computedBadges.push('🏋️ Trainer'); break;
    case 'PROFESSIONAL': computedBadges.push('🥇 Pro'); break;
  }

  switch (user.lifestyle) {
    case 'SEDENTARY': computedBadges.push('🛋️ Sedentary'); break;
    case 'ACTIVE': computedBadges.push('⚡ Active'); break;
    case 'VERY_ACTIVE': computedBadges.push('💪 Very Active'); break;
    case 'ATHLETE': computedBadges.push('🥇 Athlete'); break;
  }

  switch (user.consistency) {
    case 'ONCE_A_WEEK': computedBadges.push('📅 Once/Week'); break;
    case 'TWICE_A_WEEK': computedBadges.push('📆 Twice/Week'); break;
    case 'THREE_PLUS_WEEK': computedBadges.push('🔥 Three+/Week'); break;
    case 'RANDOM': computedBadges.push('🎲 Random'); break;
  }

  if (user.is_working_out) {
    computedBadges.push('✅ Currently Working Out');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.name}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.rating}>⭐ Average Rating: {rating ?? 'N/A'}</Text>

        {/* Photos */}
        <View style={styles.photoList}>
          <View style={styles.photoGrid}>
            {photos.map((item) => (
              <TouchableOpacity
                key={String(item.photo_id)}
                activeOpacity={0.9}
                onPress={() => onOpenPreview(item)}
                style={styles.photoWrap}
              >
                <Image source={{ uri: item.image_url }} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About Me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.sectionText}>
            {user.about_me || 'This user hasn’t added anything yet.'}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Info</Text>
          <Text style={styles.sectionText}>
            Experience Level: {user.experience_level || 'Not specified'}
          </Text>
          <Text style={styles.sectionText}>
            Lifestyle: {user.lifestyle || 'Not specified'}
          </Text>
          <Text style={styles.sectionText}>
            Consistency: {user.consistency || 'Not specified'}
          </Text>
        </View>

        {/* Badges (computed client-side) */}
        {!!computedBadges.length && (
          <View style={styles.badgeContainer}>
            {computedBadges.map((badge, i) => (
              <View key={`${badge}-${i}`} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Reviews */}
        {!!recentReviews.length && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
            {recentReviews.map((review) => (
              <View key={String(review.review_id)} style={styles.reviewItem}>
                <Text style={styles.stars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </Text>
                <Text style={styles.reviewText}>{review.comment}</Text>
                <Text style={styles.timestamp}>
                  {new Date(review.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Fullscreen preview modal */}
      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={closePreview}>
            <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>

          {preview ? (
            <>
              <Image source={{ uri: preview.uri }} style={styles.previewFullscreen} resizeMode="contain" />
              {isOwnProfile && (
                <View style={styles.previewActions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.replaceBtn]} onPress={handleReplace}>
                    <Text style={styles.actionBtnText}>Replace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ViewUserProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  loading: {
    color: '#fff',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  rating: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  photoList: { marginBottom: 20 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  photo: {
    width: 110,
    aspectRatio: 4 / 5,
    backgroundColor: '#333',
    resizeMode: 'cover',
  },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 6,
  },
  sectionText: {
    color: '#fff',
    marginBottom: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  badge: {
    backgroundColor: '#FFD70033',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: '#FFD700', fontSize: 12 },
  reviewItem: {
    borderTopWidth: 1,
    borderColor: '#333',
    paddingTop: 10,
    marginTop: 10,
  },
  stars: { color: '#FFD700', marginBottom: 4 },
  reviewText: { color: '#ccc' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 4 },

  // Preview modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 8,
  },
  previewFullscreen: {
    width: '92%',
    height: '75%',
    borderRadius: 12,
  },
  previewActions: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  actionBtnText: { color: '#121212', fontWeight: 'bold' },
  replaceBtn: { backgroundColor: '#00E5A8' },
  deleteBtn: { backgroundColor: '#EF4444' },
});
