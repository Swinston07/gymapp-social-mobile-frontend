// src/screens/User/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { registerUser } from '../../api/userApi';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";

const PLACEHOLDER_COLOR = '#D6D6D6'; // brighter on dark background

const RegisterScreen = () => {
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password_hash: "",
    first_name: "",
    last_name: "",
    age: "",
    start_weight: "",
    start_body_fat_percentage: "",
    feet: "",
    inches: "",
  });
  
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async () => {
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?#&]).{8,}$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (!passwordPattern.test(formData.password_hash)) {
      Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    if (formData.password_hash !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await registerUser(formData);
      Alert.alert("Success", "Registration successful!");
      navigation.navigate('Login' as never);
    } catch (error) {
      Alert.alert("Error", "Failed to register. Please try again.");
    }
  };

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Register</Text>

            {/* Render all fields except password_hash */}
            {Object.entries(formData).map(([key, value]) => {
              if (key === "password_hash") return null;
              const label = key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, char => char.toUpperCase());

              const numericKeys = ["age", "start_weight", "start_body_fat_percentage", "feet", "inches"];
              const isNumeric = numericKeys.includes(key);

              return (
                <TextInput
                  key={key}
                  style={styles.input}
                  placeholder={label}
                  placeholderTextColor={PLACEHOLDER_COLOR}
                  value={value}
                  onChangeText={(text) => updateField(key, text)}
                  keyboardType={isNumeric ? "numeric" : "default"}
                  autoCapitalize={key === 'email' || key === 'username' ? 'none' : 'sentences'}
                />
              );
            })}

            {/* Password Field */}
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={formData.password_hash}
              onChangeText={(text) => updateField("password_hash", text)}
              secureTextEntry
              autoCapitalize="none"
            />

            {/* Confirm Password Field */}
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={PLACEHOLDER_COLOR}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
              <Text style={{ color: '#FFD700', marginTop: 16, textAlign: 'center' }}>
                Already have an account? Login
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container:{
    padding: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#565656', // slightly lighter for more contrast
    color: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#121212',
    fontSize: 16,
    fontWeight: 'bold',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  }
});
