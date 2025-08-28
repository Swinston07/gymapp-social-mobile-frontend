import React, { useCallback, useEffect, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { getUserPhotos, uploadPhoto } from '../../api/photoApi';

interface Props {
  route: { params: { id: number } };
}

const MAX_PHOTOS = 6;
const CROPPED_ASPECT: [number, number] = [4, 5];
const PREVIEW_WIDTH = 1080; // resize width for consistent uploads

const PhotoUploadScreen: React.FC<Props> = ({ route }) => {
  const { id: userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(true);
  const [photoCount, setPhotoCount] = useState(0);
  const [message, setMessage] = useState('');

  // Fetch current photo count
  const fetchCount = useCallback(async () => {
    try {
      setLoadingCount(true);
      const photos = await getUserPhotos(userId);
      setPhotoCount(Array.isArray(photos) ? photos.length : 0);
    } catch {
      // Let backend enforce the limit if this fails
    } finally {
      setLoadingCount(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useFocusEffect(
    useCallback(() => {
      fetchCount();
    }, [fetchCount])
  );

  const pickAndCrop = async () => {
    if (photoCount >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `You can upload at most ${MAX_PHOTOS} photos.`);
      return;
    }

    // Check existing permission first (avoids prompting repeatedly)
    let perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }
    if (!perm.granted) {
      Alert.alert('Permission required', 'Allow photo library access to pick an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: CROPPED_ASPECT,
      quality: 1,
      exif: false,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    try {
      const srcUri = result.assets[0].uri;
      const manipulated = await ImageManipulator.manipulateAsync(
        srcUri,
        [{ resize: { width: PREVIEW_WIDTH } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImageUri(manipulated.uri);
      setMessage('');
    } catch (e) {
      console.error('Manipulate error:', e);
      Alert.alert('Image error', 'Could not process the selected image.');
    }
  };

  const cropAndUpload = async () => {
    if (!imageUri) return;
    if (photoCount >= MAX_PHOTOS) {
      Alert.alert('Limit reached', `You can upload at most ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      setUploading(true);

      const name = `photo_${Date.now()}.jpg`;
      const file: any = { uri: imageUri, name, type: 'image/jpeg' };

      const formData = new FormData();
      formData.append('image', file);

      await uploadPhoto(userId, formData);

      setMessage('Upload successful!');
      setPhotoCount((c) => Math.min(MAX_PHOTOS, c + 1));
      setImageUri(null);

      // Optional: navigate back to profile after upload
      navigation.navigate('UserProfile', { id: userId });
    } catch (err: any) {
      if (err?.message === 'MAX_PHOTOS_REACHED' || err?.response?.status === 409) {
        setPhotoCount(MAX_PHOTOS);
        Alert.alert('Limit reached', `You can upload at most ${MAX_PHOTOS} photos.`);
      } else {
        console.error('Upload failed:', err);
        Alert.alert('Upload failed', 'Please try again.');
      }
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const disabledPick = uploading || loadingCount || photoCount >= MAX_PHOTOS;
  const disabledUpload = uploading || loadingCount || !imageUri;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload a Profile Photo</Text>

      <Text style={styles.counterText}>
        {loadingCount ? 'Loading…' : `${photoCount}/${MAX_PHOTOS} photos`}
      </Text>

      <TouchableOpacity
        style={[styles.primaryBtn, disabledPick && styles.btnDisabled]}
        onPress={pickAndCrop}
        disabled={disabledPick}
      >
        <Text style={styles.primaryBtnText}>
          {photoCount >= MAX_PHOTOS
            ? 'Photo limit reached'
            : imageUri
            ? 'Choose a Different Image'
            : 'Choose Image'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>Back to Home</Text>
      </TouchableOpacity>

      {imageUri && (
        <>
          <View style={styles.previewFrame}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, disabledUpload && styles.btnDisabled]}
            onPress={cropAndUpload}
            disabled={disabledUpload}
          >
            <Text style={styles.primaryBtnText}>{uploading ? 'Uploading…' : 'Upload'}</Text>
          </TouchableOpacity>
        </>
      )}

      {(uploading || loadingCount) && (
        <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 12 }} />
      )}
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default PhotoUploadScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  counterText: { color: '#FFD700', textAlign: 'center', marginBottom: 14, opacity: 0.9 },
  primaryBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#121212', fontWeight: 'bold' },
  backLink: { color: '#FFD700', textAlign: 'center', marginTop: 14, fontSize: 16 },
  previewFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewImage: { width: '100%', height: '100%' },
  message: { textAlign: 'center', color: '#FFD700', marginTop: 10 },
});
