import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { getUserById } from '../../api/userApi';
import { getUserPhotos } from '../../api/photoApi';
import { getAverageRating, getReviewsByUser } from '../../api/reviewApi';

type ViewUserProfileRouteProp = RouteProp<RootStackParamList, 'ViewUserProfile'>;

type Photo = {
  id: number;
  image_url: string;
};

type Review = {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
};

const ViewUserProfileScreen = () => {
  const route = useRoute<ViewUserProfileRouteProp>();
  const { id } = route.params;

  const [user, setUser] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rating, setRating] = useState<string | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserById(id);
        setUser(userData);

        const userPhotos = await getUserPhotos(id);
        setPhotos(userPhotos);

        const avg = await getAverageRating(id);
        if (avg !== null) setRating(avg.toFixed(1));

        const reviews = await getReviewsByUser(id);
        setRecentReviews(reviews.slice(0, 5));
      } catch (err) {
        console.error('Failed to load user profile', err);
      }
    };

    fetchData();
  }, [id]);

  if (!user) return <Text style={styles.loading}>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>
        {user.first_name} {user.last_name}
      </Text>
      <Text style={styles.rating}>
        ⭐ Average Rating: {rating ?? 'N/A'}
      </Text>

      {/* Photos */}
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        style={styles.photoList}
        renderItem={({ item }) => (
          <Image source={{ uri: item.image_url }} style={styles.photo} />
        )}
      />

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

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <View style={styles.badgeContainer}>
          {user.badges.map((badge: string, index: number) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Reviews */}
      {recentReviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews</Text>
          {recentReviews.map((review) => (
            <View key={review.review_id} style={styles.reviewItem}>
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
  );
};

export default ViewUserProfileScreen;


const styles = StyleSheet.create({
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
  photoList: {
    marginBottom: 20,
  },
  photo: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 8,
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
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#FFD70033',
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
  },
  reviewItem: {
    borderTopWidth: 1,
    borderColor: '#333',
    paddingTop: 10,
    marginTop: 10,
  },
  stars: {
    color: '#FFD700',
    marginBottom: 4,
  },
  reviewText: {
    color: '#ccc',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});
