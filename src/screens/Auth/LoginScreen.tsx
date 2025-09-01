import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../../api/userApi';
import { AuthContext } from '../../AuthContext/AuthContext';

const LoginScreen = () => {
  const [formData, setFormData] = useState({ username: '', password_hash: '' });
  const { login } = useContext(AuthContext);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const response = await loginUser(formData);
      const { user, token } = response;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', String(user.id));
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (typeof login === 'function') await login(user, token);

      // Tell AppStack to re-render into the App navigator
      DeviceEventEmitter.emit('auth:login');
      // No manual navigation needed
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={formData.username}
          onChangeText={(text) => handleChange('username', text)}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={formData.password_hash}
          onChangeText={(text) => handleChange('password_hash', text)}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1, borderColor: '#444', color: 'white',
    borderRadius: 8, padding: 12, marginBottom: 16,
  },
  button: { backgroundColor: '#FFD700', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#121212', fontSize: 16, fontWeight: 'bold' },
});
