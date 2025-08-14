import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import * as Location from 'expo-location';
import { getGymSuggestions, updateHomeGymData } from '../../api/userApi';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type GymSuggestion = {
  id: string;
  title: string;
  address: {
    label: string;
  };
  position: {
    lat: number;
    lng: number;
  };
  category?: {
    id: string;
  };
};

type SetHomeGymRouteProp = RouteProp<RootStackParamList, 'SetHomeGym'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SetHomeGymScreen = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<GymSuggestion[]>([]);
  const [selectedGym, setSelectedGym] = useState<GymSuggestion | null>(null);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SetHomeGymRouteProp>();
  const { id: userId } = route.params;

  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location to find gyms nearby.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ lat: loc.coords.latitude, lon: loc.coords.longitude });
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchInput && location) {
        try {
          const data: GymSuggestion[] = await getGymSuggestions(searchInput, location.lat, location.lon);
          const filtered = data.filter(item =>
            item.category?.id === '700-7100-0057' || /gym|fitness|training/i.test(item.title)
          );
          setSuggestions(filtered);
        } catch (err) {
          console.error('Failed to fetch suggestions', err);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [searchInput, location]);

  const handleSelect = async (gym: GymSuggestion) => {
    try {
      await updateHomeGymData(userId, {
        home_gym: `${gym.title}, ${gym.address.label}`,
        latitude: gym.position.lat,
        longitude: gym.position.lng,
      });
      setSelectedGym(gym);
      setMessage('✅ Home gym updated!');
      setShowSuggestions(false);
      Keyboard.dismiss();
    } catch (err) {
      console.error('Error updating gym:', err);
      setMessage('❌ Failed to update home gym');
    }
  };

  const handleDismiss = () => {
    Keyboard.dismiss();
    setShowSuggestions(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.inner}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.box}>
              <Text style={styles.heading}>Set Your Home Gym</Text>

              <TextInput
                placeholder="Search gym name..."
                value={searchInput}
                onChangeText={(text) => {
                  setSearchInput(text);
                  setShowSuggestions(true);
                }}
                style={styles.input}
                placeholderTextColor="#aaa"
              />

              {showSuggestions && (
                <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item.id || item.title}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
                      <Text style={styles.listText}>{item.title}, {item.address?.label}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled={false}
                  keyboardShouldPersistTaps="handled"
                />
              )}

              {selectedGym && (
                <View style={styles.confirmation}>
                  <Text style={styles.confirmText}>
                    ✅ Selected: {selectedGym.title}, {selectedGym.address?.label}
                  </Text>
                </View>
              )}

              {!!message && (
                <Text style={styles.message}>{message}</Text>
              )}

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.navigate('UserProfile', { id: userId })}
              >
                <Text style={styles.backButtonText}>⬅ Back to Home</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default SetHomeGymScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  inner: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  box: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    marginTop: 50,
  },
  heading: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FFD700',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    color: '#fff',
    marginBottom: 12,
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  listText: {
    color: '#fff',
  },
  confirmation: {
    marginTop: 16,
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 6,
    borderColor: '#FFD700',
    borderWidth: 1,
  },
  confirmText: {
    color: '#FFD700',
  },
  message: {
    marginTop: 10,
    color: '#FF5A5F',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    borderRadius: 6,
  },
  backButtonText: {
    textAlign: 'center',
    color: '#000',
    fontWeight: 'bold',
  },
});
