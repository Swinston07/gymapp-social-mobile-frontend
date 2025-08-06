// src/screens/User/OnboardingScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserById, updateUser } from '../../api/userApi';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingRouteProp = RouteProp<RootStackParamList, 'Onboarding'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const OnboardingScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<OnboardingRouteProp>();
  const { id } = route.params;

  const [formData, setFormData] = useState({
    experience_level: '',
    lifestyle: '',
    consistency: '',
    about_me: '',
  });

  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getUserById(id);
        setFormData({
          experience_level: data.experience_level || '',
          lifestyle: data.lifestyle || '',
          consistency: data.consistency || '',
          about_me: data.about_me || '',
        });
      } catch {
        setMessage('Failed to load user data.');
      }
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async () => {
    try {
      await updateUser(id, formData);
      Alert.alert('Success', 'Profile submitted successfully!');
      navigation.navigate('UserProfile', { id });
    } catch {
      Alert.alert('Error', 'Failed to submit profile');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.container}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={100} // adjust based on need
      >
              <Text style={styles.title}>Complete Your Profile</Text>

              <Text style={styles.label}>Experience Level</Text>
              <Picker
                  selectedValue={formData.experience_level}
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, experience_level: value }))}
                  style={styles.picker}
              >
                  <Picker.Item label="Select Experience Level" value="" />
                  <Picker.Item label="Beginner" value="BEGINNER" />
                  <Picker.Item label="Experienced" value="EXPERIENCED" />
                  <Picker.Item label="Advanced" value="ADVANCED" />
                  <Picker.Item label="Trainer" value="TRAINER" />
                  <Picker.Item label="Professional" value="PROFESSIONAL" />
              </Picker>

              <Text style={styles.label}>Lifestyle</Text>
              <Picker
                  selectedValue={formData.lifestyle}
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, lifestyle: value }))}
                  style={styles.picker}
              >
                  <Picker.Item label="Select Lifestyle" value="" />
                  <Picker.Item label="Sedentary" value="SEDENTARY" />
                  <Picker.Item label="Active" value="ACTIVE" />
                  <Picker.Item label="Very Active" value="VERY_ACTIVE" />
                  <Picker.Item label="Athlete" value="ATHLETE" />
              </Picker>

              <Text style={styles.label}>Consistency</Text>
              <Picker
                  selectedValue={formData.consistency}
                  onValueChange={(value: string) => setFormData((prev) => ({ ...prev, consistency: value }))}
                  style={styles.picker}
              >
                  <Picker.Item label="Select Consistency" value="" />
                  <Picker.Item label="Once/week" value="ONCE_A_WEEK" />
                  <Picker.Item label="Twice/week" value="TWICE_A_WEEK" />
                  <Picker.Item label="Three+/week" value="THREE_PLUS_WEEK" />
                  <Picker.Item label="Random" value="RANDOM" />
              </Picker>

              <Text style={styles.label}>About Me</Text>
              <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Tell us about your goals or fitness journey"
                  value={formData.about_me}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, about_me: text }))}
              />

              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                  <Text style={styles.buttonText}>Submit Profile</Text>
              </TouchableOpacity>
          </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  picker: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    marginBottom: 12,
    borderRadius: 10,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#121212',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  }
});
