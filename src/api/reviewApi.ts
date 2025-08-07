import axios from 'axios';
import { BASE_URL } from '@env';

// Types
export interface Review {
  review_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: number;
  reviewed_id: number;
}

export interface ReviewPayload {
  rating: number;
  comment: string;
}

const getAuthHeader = async (): Promise<{ Authorization: string }> => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ✅ Submit a review (rating + comment)
export const createReview = async (
  userId: number,
  reviewData: ReviewPayload
): Promise<Review | null> => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(
      `${BASE_URL}/users/${userId}/reviews`,
      reviewData,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error('Failed to submit review', err);
    return null;
  }
};

// ✅ Get all reviews received by a user
export const getReviewsByUser = async (
  userId: number
): Promise<Review[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${BASE_URL}/users/${userId}/reviews`, {
      headers,
    });
    return response.data;
  } catch (err) {
    console.error('Failed to fetch reviews', err);
    return [];
  }
};

// ✅ Get all reviews written by a user
export const getReviewsWrittenByUser = async (
  userId: number
): Promise<Review[]> => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(
      `${BASE_URL}/users/${userId}/reviews/written`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error('Failed to fetch reviews written by user', err);
    return [];
  }
};

// ✅ Get average rating for a user
export const getAverageRating = async (
  userId: number
): Promise<number | null> => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(
      `${BASE_URL}/users/${userId}/reviews/average`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error('Failed to fetch average rating:', err);
    return null;
  }
};
