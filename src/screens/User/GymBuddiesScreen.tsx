import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getGymBuddies } from '../../api/gymBuddiesApi';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

type Buddy = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
};

const GymBuddiesScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id: userId } = route.params;

  const [buddies, setBuddies] = useState<Buddy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGymBuddies = async () => {
      try {
        const data = await getGymBuddies(userId);
        setBuddies(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGymBuddies();
  }, [userId]);

  const handleChatClick = (buddyId: number) => {
    navigation.navigate('Chat', { id: userId, buddyId });
  };

  const handleViewProfileClick = (buddyId: number) => {
    navigation.navigate('ViewUserProfile', { id: buddyId });
  };

  const handleScheduleClick = (buddyId: number) => {
    navigation.navigate('ScheduleWorkout', { id: userId, buddyId });
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 100 }} size="large" />;
  }

  return (
    <SafeAreaView style={ styles.safeArea }>
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>My Gym Buddies</Text>
            {buddies.length === 0 ? (
            <Text style={styles.noBuddies}>No Gym Buddies yet.</Text>
            ) : (
            buddies.map((buddy) => (
                <View key={buddy.id} style={styles.card}>
                <Text style={styles.name}>{buddy.first_name} {buddy.last_name}</Text>
                <Text style={styles.username}>@{buddy.username}</Text>
                <View style={styles.buttonGroup}>
                    <TouchableOpacity style={styles.button} onPress={() => handleChatClick(buddy.id)}>
                    <Text style={styles.buttonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => handleViewProfileClick(buddy.id)}>
                    <Text style={styles.buttonText}>View Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => handleScheduleClick(buddy.id)}>
                    <Text style={styles.buttonText}>Schedule Workout</Text>
                    </TouchableOpacity>
                </View>
                </View>
            ))
            )}

            {/* ✅ Back to Profile button */}
            <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('UserProfile', { id: userId })}
            >
            <Text style={styles.backButtonText}>Back to Profile</Text>
            </TouchableOpacity>
        </ScrollView>
    </SafeAreaView>
  );

};

export default GymBuddiesScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  noBuddies: {
    color: '#ccc',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderColor: '#333',
    borderWidth: 1,
  },
  name: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  username: {
    color: '#aaa',
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignSelf: 'center',
    width: '100%',
  },
  backButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212', // or any consistent background color
  },
});
