import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, HERE_API_KEY } from '@env';

// Define the shape of the filters object
interface MatchFilters {
  role?: string;
  min_age?: string;
  max_age?: string;
  experience_level?: string;
  lifestyle?: string;
  consistency?: string;
}

// Define the shape of the returned user if needed (optional)
interface MatchUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  age: number;
  role: string;
  // ... Add other expected fields if necessary
}

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

export const updateHomeGymData = async (userId: number, homeGymData: any) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/users/${userId}/update-location`,
      homeGymData,
      {
        headers: {
          ...await getAuthHeader(),
          'Content-Type': 'application/json',
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating home gym:', error.response?.data || error.message);
    throw error;
  }
};

export const getGymSuggestions = async (query: string, lat: number, lon: number) => {
  try {
    const response = await axios.get(
      `https://autosuggest.search.hereapi.com/v1/autosuggest`,
      {
        params: {
          q: query,
          at: `${lat},${lon}`,
          apiKey: HERE_API_KEY,
        },
      }
    );
    return response.data.items;
  } catch (error) {
    console.error('Error fetching gym suggestions:', error);
    throw error;
  }
};

export const getFilteredMatches = async (
  userId: number,
  filters: MatchFilters
): Promise<MatchUser[]> => {
  try {
    const params = new URLSearchParams();

    if (filters.role) params.append('role', filters.role);
    if (filters.min_age) params.append('min_age', filters.min_age);
    if (filters.max_age) params.append('max_age', filters.max_age);
    if (filters.experience_level) params.append('experience_level', filters.experience_level);
    if (filters.lifestyle) params.append('lifestyle', filters.lifestyle);
    if (filters.consistency) params.append('consistency', filters.consistency);

    const headers = await getAuthHeader();

    const response = await axios.get(`${BASE_URL}/users/${userId}/matches/filter?${params.toString()}`, {
      headers,
    });

    console.log('Filter query:', params.toString());
    return response.data;
  } catch (error) {
    console.error('Error fetching filtered matches:', error);
    throw error;
  }
};
