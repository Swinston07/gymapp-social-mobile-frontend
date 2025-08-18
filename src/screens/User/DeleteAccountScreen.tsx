// src/screens/Settings/DeleteAccountScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { deleteUser } from '../../api/userApi';
import { useAuth } from '../../AuthContext/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

const DeleteAccountScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id: userId } = route.params;
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This action is permanent. All your data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ],
    );
  };

  const doDelete = async () => {
    try {
      setLoading(true);
      await deleteUser(userId);
      // Clear local auth and go to auth screen
      await logout();
      // navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] }); // if needed
    } catch (e: any) {
      console.error('Delete failed', e?.response?.data || e?.message);
      Alert.alert('Delete failed', 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.warning}>
        This will permanently delete your account and data.
        This action cannot be undone.
      </Text>

      <TouchableOpacity
        onPress={confirmDelete}
        style={[styles.deleteBtn, loading && { opacity: 0.6 }]}
        disabled={loading}
      >
        <Text style={styles.deleteText}>{loading ? 'Deleting…' : 'Delete my account'}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}

      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24 }}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

export default DeleteAccountScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  title: { color: '#FFD700', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  warning: { color: '#e5e5e5', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  deleteBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '700' },
  cancel: { color: '#FFD700', textAlign: 'center', fontSize: 16 },
});
