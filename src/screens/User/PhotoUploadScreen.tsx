import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadPhoto } from '../../api/photoApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { TouchableOpacity } from 'react-native';

interface Props {
  route: { params: { id: number } };
}

const PhotoUploadScreen: React.FC<Props> = ({ route }) => {
  const { id: userId } = route.params;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission denied", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets.length > 0) {
      const selected = result.assets[0];
      setImageUri(selected.uri);
    }
  };

  const cropAndUpload = async () => {
    if (!imageUri) return;

    try {
      setUploading(true);
      const cropped = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ crop: { originX: 0, originY: 0, width: 500, height: 500 } }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const uriParts = cropped.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];

      const formData = new FormData();
      formData.append('image', {
        uri: cropped.uri,
        name: `photo.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const token = await AsyncStorage.getItem('token');

      await uploadPhoto(userId, formData);

      setMessage('Upload successful!');
      
      // ✅ Navigate back to UserProfile with userId
      navigation.navigate('UserProfile', { id: userId });

    } catch (err) {
      console.error('Upload failed:', err);
      setMessage('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload a Profile Photo</Text>

      <Button title="Choose Image" onPress={pickImage} />

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backLink}>Back to Profile</Text>
      </TouchableOpacity>


      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Button title="Crop & Upload" onPress={cropAndUpload} />
        </>
      )}

      {uploading && <ActivityIndicator size="large" color="#FFD700" />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    marginVertical: 20,
    borderRadius: 10,
  },
  message: {
    textAlign: 'center',
    color: '#FFD700',
    marginTop: 10,
  },
  backLink: {
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  }
});
