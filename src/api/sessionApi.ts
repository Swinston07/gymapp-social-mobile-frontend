import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const scheduleWorkoutSession = async (userId: number, sessionData: any) => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.post(`${BASE_URL}/users/${userId}/sessions`, sessionData, {
      headers,
    });
    return response.data;
  } catch (err) {
    console.error('Failed to schedule session', err);
    return null;
  }
};

export const getSessionsByStatus = async (userId: number, status: string) => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.get(
      `${BASE_URL}/users/${userId}/sessions?status=${status}`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error(`Failed to fetch sessions with status ${status}`, err);
    return null;
  }
};

export const updateSessionStatus = async (sessionId: number, status: string) => {
  try {
    const headers = await getAuthHeader();
    const response = await axios.put(
      `${BASE_URL}/sessions/${sessionId}/status/${status}`,
      {},
      { headers }
    );
    return response.status === 200;
  } catch (err) {
    console.error(`Failed to update session status to ${status}`, err);
    return false;
  }
};
