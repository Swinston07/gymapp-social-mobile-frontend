import React, {useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getUserById } from '../../api/userApi';
import { RootStackParamList } from '../../types';

type UserProfileRouteProp = RouteProp<RootStackParamList, "UserProfile">;
type UserProfileNavProp = NativeStackNavigationProp<RootStackParamList>;

const isProfileIncomplete = (user: any) => {
        return !user.experience_level || !user.lifestyle || !user.consistency || !user.about_me;
    };

const UserProfileScreen = () => {
    const navigation = useNavigation<UserProfileNavProp>();
    const route = useRoute<UserProfileRouteProp>();
    const { id } = route.params;

    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState('');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const storedUser = await AsyncStorage.getItem('user');
            const parsedUser = storedUser ? JSON.parse(storedUser) : null;

            if(!parsedUser || parsedUser.id.toString() !== id.toString()) {
                navigation.navigate('Login' as never);
                return;
            }

            try {
                const data = await getUserById(id);
                setUser(data);
                const dismissedStatus = await AsyncStorage.getItem(`dismiss-onboarding-${id}`);
                setDismissed(dismissedStatus === 'true');
            } catch (err) {
                setError('Failed to load user profile.');
            }
        };

        fetchUser();
    }, [id]);

    const dismissPrompt = async () => {
        setDismissed(true);
        await AsyncStorage.setItem(`dismiss-onboarding-${id}`, 'true');
    };

    if (error) return <Text style={styles.error}>{error}</Text>;
    if (!user) return <Text style={styles.loading}>Loading...</Text>;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                {!dismissed && isProfileIncomplete(user) && (
                    <View style={styles.prompt}>
                        <Text style={styles.promptText}>Complete your profile for better gym buddy matching!</Text>
                        <TouchableOpacity
                            style={styles.promptButton}
                            onPress={() => navigation.navigate('Onboarding', { id })}
                        >
                            <Text style={styles.promptButtonText}>Complete Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={dismissPrompt}>
                            <Text style={styles.dismissText}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <Text style={styles.title}>Welcome, {user.username}</Text>
                <Text style={styles.subtitle}>Your Journey in Motion</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your stats</Text>
                    <Text style={styles.cardText}>Start Weight: {user.start_weight}</Text>
                    <Text style={styles.cardText}>Start Body Fat %: {user.start_body_fat_percentage}%</Text>
                    <Text style={styles.cardText}>Height: {user.feet}'{user.inches}</Text>
                    <Text style={styles.cardText}>Current Weight: {user.current_weight}</Text>
                    <Text style={styles.cardText}>Current Body Fat %: {user.current_body_fat_percentage}%</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('EditProfile', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('PhotoUpload', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>Upload Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ViewUserProfile', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>View Your Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('SetHomeGym', { id: user.id })}
                        style={styles.linkButton}
                        >
                        <Text style={styles.linkButtonText}>Set Home Gym</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Matches', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>Find Gym Buddies</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('GymBuddies', { id: user.id })}
                        style={styles.linkButton}
                    >
                            <Text style={styles.linkButtonText}>My Gym Buddies</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('PendingInvites', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>Pending Invites</Text>
                    </TouchableOpacity>
 
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ScheduledSessions', { id: user.id })}
                        style={styles.linkButton}
                    >
                        <Text style={styles.linkButtonText}>Scheduled Sessions</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#121212',
        flexGrow: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        color: '#FFD700',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        color: '#aaa',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    cardTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    cardText: {
        color: '#fff',
        marginBottom: 6,
    },
    prompt: {
        backgroundColor: '#FFEB3B',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    promptText: {
        color: '#000',
        marginBottom: 8,
    },
    promptButton: {
        backgroundColor: '#FBC02D',
        padding: 10,
        borderRadius: 8,
        marginBottom: 4,
    },
    promptButtonText: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
    dismissText: {
        textAlign: 'right',
        color: '#555',
        fontSize: 12,
    },
    error: {
        color: 'red',
        padding: 16,
    },
    loading: {
        color: '#fff',
        padding: 16,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#121212',
    },
    linkButton: {
        backgroundColor: '#FFD700',
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
    },
    linkButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});