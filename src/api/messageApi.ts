// src/api/messageApi.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env'; // assumes you're using react-native-dotenv

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const getMessagesBetweenUsers = async (userId: number, buddyId: number) => {
  const headers = await getAuthHeader();
  const res = await axios.get(`${BASE_URL}/messages/${userId}/${buddyId}`, { headers });
  return res.data;
};

export const sendMessage = async (
  userId: number,
  receiverId: number,
  messageData: { content: string }
) => {
  const headers = await getAuthHeader();
  const res = await axios.post(`${BASE_URL}/messages/${userId}/${receiverId}`, messageData, {
    headers,
  });
  return res.data;
};

export const deleteMessage = async (messageId: number) => {
  const headers = await getAuthHeader();
  const res = await axios.delete(`${BASE_URL}/messages/${messageId}`, { headers });
  return res.data;
};
