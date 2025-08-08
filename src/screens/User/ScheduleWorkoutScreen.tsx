// src/screens/User/ScheduleWorkoutScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { scheduleWorkoutSession } from '../../api/sessionApi';
import { RootStackParamList } from '../../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScheduleWorkoutScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: userId, buddyId } = route.params;

  const [dateTime, setDateTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [message, setMessage] = useState('');

  const handleSchedule = async () => {
    setShowDatePicker(false);
    setShowTimePicker(false);

    const payload = {
      user1_id: userId,
      user2_id: buddyId,
      scheduled_time: dateTime.toISOString(),
      status: 'PENDING',
    };

    const result = await scheduleWorkoutSession(userId, payload);
    if (result) {
      setMessage('Workout session scheduled!');
      setTimeout(() => navigation.navigate('UserProfile', { id: userId }), 1500);
    } else {
      setMessage('Failed to schedule session.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Schedule Workout</Text>

        <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>Select Date</Text>
        </TouchableOpacity>

        {showDatePicker && (
        <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Pick a Date</Text>
            <DateTimePicker
            value={dateTime}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={new Date()}
            themeVariant="dark"
            onChange={(_, selectedDate) => {
                if (selectedDate) {
                setDateTime((prev) =>
                    new Date(
                    selectedDate.getFullYear(),
                    selectedDate.getMonth(),
                    selectedDate.getDate(),
                    prev.getHours(),
                    prev.getMinutes()
                    )
                );
                }
            }}
            />
        </View>
        )}

        <TouchableOpacity onPress={() => setShowTimePicker(!showTimePicker)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>Select Time</Text>
        </TouchableOpacity>

        {showTimePicker && (
        <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Pick a Time</Text>
            <DateTimePicker
            value={dateTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            themeVariant="dark"
            onChange={(_, selectedTime) => {
                if (selectedTime) {
                setDateTime((prev) =>
                    new Date(
                    prev.getFullYear(),
                    prev.getMonth(),
                    prev.getDate(),
                    selectedTime.getHours(),
                    selectedTime.getMinutes()
                    )
                );
                }
            }}
            />
        </View>
        )}

        <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>Selected: {dateTime.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.scheduleButton} onPress={handleSchedule}>
        <Text style={styles.scheduleText}>Schedule Session</Text>
        </TouchableOpacity>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('UserProfile', { id: userId })}
            >
            <Text style={styles.backButtonText}>Back to Profile</Text>
        </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ScheduleWorkoutScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  toggleButton: {
    backgroundColor: '#333',
    borderColor: '#FFD700',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerWrapper: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 10,
    borderColor: '#FFD700',
    borderWidth: 1,
    marginBottom: 20,
  },
  pickerLabel: {
    color: '#FFD700',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryBox: {
    backgroundColor: '#222',
    padding: 12,
    borderRadius: 8,
    borderColor: '#444',
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  scheduleButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    color: '#00ffcc',
    marginTop: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  backButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
