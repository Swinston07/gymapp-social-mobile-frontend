// src/screens/User/PhotoUploadScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { uploadPhoto } from '../../api/photoApi';

interface Props {
  route: { params: { id: number } };
}

// Choose one canonical aspect for profile/card images
const CROPPED_ASPECT: [number, number] = [4, 5];
const PREVIEW_WIDTH = 1080; // resize width for consistent uploads

const PhotoUploadScreen: React.FC<Props> = ({ route }) => {
  const { id: userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const pickAndCrop = async () => {
    // Permission (iOS shows system sheet if not granted; Android needs this)
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Allow photo library access to pick an image.');
      return;
    }

    // System crop UI with a fixed aspect
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: CROPPED_ASPECT, // e.g. 4:5 portrait
      quality: 1,
      exif: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    // Normalize the cropped file (consistent size/encoding)
    const srcUri = result.assets[0].uri;
    const manipulated = await ImageManipulator.manipulateAsync(
      srcUri,
      [{ resize: { width: PREVIEW_WIDTH } }], // keeps aspect automatically
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    setImageUri(manipulated.uri);
    setMessage('');
  };

  const cropAndUpload = async () => {
    if (!imageUri) return;

    try {
      setUploading(true);

      // Build a FormData upload with a normalized JPEG
      const name = `photo_${Date.now()}.jpg`;
      const file: any = { uri: imageUri, name, type: 'image/jpeg' };

      const formData = new FormData();
      formData.append('image', file);

      // If your uploadPhoto already attaches auth header, no need to read token here.
      // (Keeping in case your API needs it internally.)
      const _token = await AsyncStorage.getItem('token');

      await uploadPhoto(userId, formData);

      setMessage('Upload successful!');
      // Go back to the profile and show the new image
      navigation.navigate('UserProfile', { id: userId });
    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Upload failed');
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload a Profile Photo</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={pickAndCrop}>
        <Text style={styles.primaryBtnText}>
          {imageUri ? 'Choose a Different Image' : 'Choose Image'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>Back to Profile</Text>
      </TouchableOpacity>

      {imageUri && (
        <>
          {/* Preview uses the same aspect ratio everywhere */}
          <View style={styles.previewFrame}>
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, uploading && styles.btnDisabled]}
            onPress={cropAndUpload}
            disabled={uploading}
          >
            <Text style={styles.primaryBtnText}>
              {uploading ? 'Uploading…' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {uploading && <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 12 }} />}
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default PhotoUploadScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#121212', fontWeight: 'bold' },
  backLink: {
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 14,
    fontSize: 16,
  },
  // Consistent 4:5 preview container
  previewFrame: {
    width: '100%',
    aspectRatio: 4 / 5, // must match CROPPED_ASPECT
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  message: {
    textAlign: 'center',
    color: '#FFD700',
    marginTop: 10,
  },
});
