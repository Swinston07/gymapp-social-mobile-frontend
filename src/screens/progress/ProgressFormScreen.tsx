// src/screens/User/ProgressFormScreen.tsx
import React, { useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RootStackParamList } from '../../types';
import { addUserProgress } from '../../api/progressApi';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ProgressFormRouteProp = RouteProp<RootStackParamList, 'ProgressForm'>;
type ProgressScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

const ProgressFormScreen = () => {
    const navigation = useNavigation<ProgressScreenNavProp>();
  const route = useRoute<ProgressFormRouteProp>();
  const { id: userId } = route.params;

  const [weight, setWeight] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Basic guards
    const weightNum = parseFloat(weight);
    const bodyFatNum = parseFloat(bodyFat);
    if (Number.isNaN(weightNum) || Number.isNaN(bodyFatNum)) {
      setMessage('Please enter valid numbers.');
      return;
    }

    const progressData = {
      user_id: Number(userId),
      weight: weightNum,
      body_fat_percentage: bodyFatNum,
    };

    try {
      setSubmitting(true);
      await addUserProgress(Number(userId), progressData);
      setMessage('Progress logged successfully!');
      setWeight('');
      setBodyFat('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to log progress.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuccess = message.toLowerCase().includes('success');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.wrapper}>
          <Text style={styles.title}>Log Your Progress</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Weight (lbs):</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="e.g. 175"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Body Fat %:</Text>
            <TextInput
              style={styles.input}
              value={bodyFat}
              onChangeText={setBodyFat}
              keyboardType="numeric"
              placeholder="e.g. 18.5"
              placeholderTextColor="#888"
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.button, submitting && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>

          <View style={{ padding: 16 }}>
                <TouchableOpacity
                    style={styles.navButton}
                    onPress={() => navigation.navigate('Dashboard', { id: userId })}
                >
                    <Text style={styles.navButtonText}>⬅ Back to Dashboard</Text>
                </TouchableOpacity>
          </View>


          {!!message && (
            <Text style={[styles.message, isSuccess ? styles.success : styles.error]}>
              {message}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProgressFormScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  wrapper: {
    flex: 1,
    padding: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  field: { marginBottom: 14 },
  label: { color: '#ccc', marginBottom: 6 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#121212', fontWeight: 'bold', textAlign: 'center' },
  message: { marginTop: 12, textAlign: 'center' },
  success: { color: '#22C55E' },
  error: { color: '#EF4444' },
  navButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  navButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },

});
