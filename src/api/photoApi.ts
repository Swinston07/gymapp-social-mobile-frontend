import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@env';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const uploadPhoto = async (userId: number, formData: FormData) => {
    const headers = await getAuthHeader();
    const response = await axios.post(`${BASE_URL}/users/${userId}/photos`, 
        formData,
        { headers }
    )

    return response.data;
};

export const getUserPhotos = async (userId: number) => {
    const headers = await getAuthHeader();
    const response = await axios.get(`${BASE_URL}/users/${userId}/photos`,
        { headers }
    );
    return response.data;
};

export const deletePhoto = async (userId: number, photoId: number) => {
    const headers = await getAuthHeader();
    const response = await axios.delete(`${BASE_URL}/users/${userId}/photos/${photoId}`,
        { headers }
    );
    return response.data;
}