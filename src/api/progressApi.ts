// src/api/progressApi.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type ProgressPayload = {
  user_id: number;
  weight: number;
  body_fat_percentage: number;
};

export const addUserProgress = async (userId: number, data: ProgressPayload) => {
  const headers = await getAuthHeader();
  const res = await axios.post(`${BASE_URL}/progress/${userId}`, data, { headers });
  return res.data;
};

export const getUserProgress = async (userId: number) => {
  const headers = await getAuthHeader();
  const res = await axios.get(`${BASE_URL}/progress/${userId}`, { headers });
  return res.data;
};

export const deleteUserProgress = async (userId: number) => {
  const headers = await getAuthHeader();
  const res = await axios.delete(`${BASE_URL}/progress/${userId}`, { headers });
  return res.data;
};
