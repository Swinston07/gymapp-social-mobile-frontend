import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, HERE_API_KEY } from '@env';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const registerUser = async(userData: any) => {
    try{
        const response = await axios.post(`${BASE_URL}/users`, userData);
        return response.data;
    } catch(error){
        console.error("Error registering user:", error);
        throw error;
    }
};

export const loginUser = async (credentials: any) => {
  const response = await axios.post(`${BASE_URL}/login`, credentials);
  return response.data;
};

export const getUserById = async (id: number) => {
  const headers = await getAuthHeader();
    const response = await axios.get(`${BASE_URL}/users/${id}`,
      { headers }
    );
    return response.data;
};

export const updateUser = async(id: number, updatedData: any) => {
    try{
      const headers = await getAuthHeader();
        const response = await axios.put(`${BASE_URL}/users/${id}`, updatedData, 
          { headers }
          );
        return response.data;
    } catch (error) {
        console.error("Error updating user: ", error);
        throw error;
    }
};
