import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env'; // Assumes you're using expo + react-native-dotenv

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getGymBuddies = async (userId: number) => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(`${BASE_URL}/users/${userId}/gym-buddies`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching gym buddies', error);
    throw error;
  }
};
