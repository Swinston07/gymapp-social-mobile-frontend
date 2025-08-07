import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import { RootStackParamList } from '../../types';
import { getUserById, updateUser } from '../../api/userApi';
import { SafeAreaView } from 'react-native-safe-area-context';

type EditProfileNavProp = NativeStackNavigationProp<RootStackParamList>;
type EditProfileRouteProp = ReturnType<typeof useRoute>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileNavProp>();
  const route = useRoute<any>(); // or useRoute<EditProfileRouteProp>()
  const { id } = route.params;

  const [formData, setFormData] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const storedUserStr = await AsyncStorage.getItem('user');
      const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

      if (!storedUser || storedUser.id.toString() !== id.toString()) {
        navigation.navigate('Login' as never);
        return;
      }

      try {
        const data = await getUserById(id);
        setFormData(data);
      } catch (err) {
        setMessage('Failed to load user data.');
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (name: string, value: string | number) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const updated = {
        ...formData,
        age: Number(formData.age),
        start_weight: Number(formData.start_weight),
        start_body_fat_percentage: Number(formData.start_body_fat_percentage),
        current_weight: Number(formData.current_weight),
        current_body_fat_percentage: Number(formData.current_body_fat_percentage),
      };

      await updateUser(id, updated);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('UserProfile', { id }) }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  if (!formData) return <Text style={styles.loading}>Loading profile...</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Edit Profile</Text>

        {message ? <Text style={styles.error}>{message}</Text> : null}

        {/* Input Fields */}
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
        />
        <TextInput
          placeholder="Age"
          style={styles.input}
          value={String(formData.age)}
          onChangeText={(text) => handleChange('age', text)}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Start Weight (lbs)"
          style={styles.input}
          value={String(formData.start_weight)}
          onChangeText={(text) => handleChange('start_weight', text)}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Start Body Fat %"
          style={styles.input}
          value={String(formData.start_body_fat_percentage)}
          onChangeText={(text) => handleChange('start_body_fat_percentage', text)}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Current Weight (lbs)"
          style={styles.input}
          value={String(formData.current_weight)}
          onChangeText={(text) => handleChange('current_weight', text)}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Current Body Fat %"
          style={styles.input}
          value={String(formData.current_body_fat_percentage)}
          onChangeText={(text) => handleChange('current_body_fat_percentage', text)}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="About Me"
          style={[styles.input, { height: 80 }]}
          value={formData.about_me}
          onChangeText={(text) => handleChange('about_me', text)}
          multiline
        />

        {/* Pickers */}
        <Text style={styles.label}>Experience Level</Text>
        <Picker
          selectedValue={formData.experience_level}
          onValueChange={(value) => handleChange('experience_level', value)}
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
          onValueChange={(value) => handleChange('lifestyle', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Lifestyle" value="" />
          <Picker.Item label="Sedentary" value="SEDENTARY" />
          <Picker.Item label="Active" value="ACTIVE" />
          <Picker.Item label="Very Active" value="VERY_ACTIVE" />
          <Picker.Item label="Athlete" value="ATHLETE" />
        </Picker>

        <Text style={styles.label}>Workout Consistency</Text>
        <Picker
          selectedValue={formData.consistency}
          onValueChange={(value) => handleChange('consistency', value)}
          style={styles.picker}
        >
          <Picker.Item label="Select Workout Consistency" value="" />
          <Picker.Item label="Once/Week" value="ONCE_A_WEEK" />
          <Picker.Item label="Twice/Week" value="TWICE_A_WEEK" />
          <Picker.Item label="Three+/Week" value="THREE_PLUS_WEEK" />
          <Picker.Item label="Random" value="RANDOM" />
        </Picker>

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit} style={styles.button}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 24,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#444',
    borderWidth: 1,
  },
  label: {
    color: '#aaa',
    marginBottom: 4,
    marginTop: 8,
  },
  picker: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#121212',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loading: {
    color: '#fff',
    textAlign: 'center',
    padding: 20,
  }
});

