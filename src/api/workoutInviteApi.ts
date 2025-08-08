import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env'; // assumes you're using react-native-dotenv

/**
 * Sends a workout invite from sender to recipient.
 * @param senderId - ID of the user sending the invite
 * @param recipientId - ID of the user receiving the invite
 * @param message - Optional message to send
 * @returns Response message from the server
 */

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const sendWorkoutInvite = async (
  senderId: number,
  recipientId: number,
  message: string = ''
): Promise<string> => {
  try {
    const headers = await getAuthHeader();

    const response = await axios.post(
      `${BASE_URL}/users/${senderId}/workout-invites/${recipientId}`,
      { message },
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error('Failed to send workout invite:', error);
    throw error;
  }
};
