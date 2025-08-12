import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import {
  getMessagesBetweenUsers,
  sendMessage as apiSendMessage,
  deleteMessage,
} from '../../api/messageApi';
import { useWebSocket } from '../../hooks/useWebSocket';
import { markMessagesRead, markSectionSeen } from '../../api/unreadApi';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const { id: userId, buddyId } = route.params;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessagesBetweenUsers(userId, buddyId);
      setMessages(data);
      // After fetching, mark as read (best-effort)
      markMessagesRead(userId, buddyId).catch(() => {});
      // Clear global messages dot too (if you show it in the menu)
      markSectionSeen(userId, 'messages').catch(() => {});
    } catch {
      setError('Failed to load messages.');
    }
  }, [userId, buddyId]);

  // Initial and on param change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Also mark as read whenever this screen is focused
  useFocusEffect(
    useCallback(() => {
      markMessagesRead(userId, buddyId).catch(() => {});
      markSectionSeen(userId, 'messages').catch(() => {});
      // Optionally refresh on focus
      fetchMessages();
    }, [userId, buddyId, fetchMessages])
  );

  const handleWebSocketMessage = useCallback(
    (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          content: data.message,
          sender_id: buddyId,
          sent_at: new Date(),
        },
      ]);
      // mark read since we're viewing this thread
      markMessagesRead(userId, buddyId).catch(() => {});
      scrollViewRef.current?.scrollToEnd({ animated: true });
    },
    [buddyId, userId]
  );

  const { sendMessage: sendWsMessage } = useWebSocket(userId, handleWebSocketMessage);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await apiSendMessage(userId, buddyId, { content: newMessage });
      sendWsMessage(buddyId, newMessage);

      setMessages((prev) => [
        ...prev,
        {
          content: newMessage,
          sender_id: userId,
          sent_at: new Date(),
          temp_id: `temp-${Date.now()}-${Math.random()}`,
        },
      ]);
      setNewMessage('');
      scrollViewRef.current?.scrollToEnd({ animated: true });

      // Re-fetch (to get real IDs) and ensure read marker is up to date
      await fetchMessages();
      markMessagesRead(userId, buddyId).catch(() => {});
      markSectionSeen(userId, 'messages').catch(() => {});
    } catch {
      setError('Failed to send message.');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
    } catch {
      setError('Failed to delete message.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={80}
      >
        <Text style={styles.title}>Chat</Text>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.message_id ?? msg.temp_id}
              style={[
                styles.messageBubble,
                msg.sender_id === userId ? styles.sent : styles.received,
              ]}
            >
              <Text style={styles.messageText}>{msg.content}</Text>
              <Text style={styles.timestamp}>
                {new Date(msg.sent_at).toLocaleString()}
              </Text>
              {msg.sender_id === userId && msg.message_id && (
                <TouchableOpacity
                  onPress={() => handleDeleteMessage(msg.message_id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#121212' },
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 20, fontWeight: 'bold', color: '#FFD700',
    textAlign: 'center', marginBottom: 8,
  },
  messageScroll: { flex: 1, marginBottom: 10 },
  messageList: { paddingBottom: 16 },
  messageBubble: {
    borderRadius: 12, padding: 10, marginBottom: 10,
    maxWidth: '75%', position: 'relative',
  },
  sent: { backgroundColor: '#FFD700', alignSelf: 'flex-end' },
  received: { backgroundColor: '#555', alignSelf: 'flex-start' },
  messageText: { color: '#000' },
  timestamp: { fontSize: 10, color: '#ccc', marginTop: 4, textAlign: 'right' },
  deleteButton: { position: 'absolute', top: 4, right: 6 },
  deleteText: { color: 'red', fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: '#222', color: '#fff', padding: 10,
    borderRadius: 8, borderColor: '#444', borderWidth: 1, marginRight: 8,
  },
  sendButton: { backgroundColor: '#FFD700', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sendText: { fontWeight: 'bold', color: '#121212' },
  error: { color: 'red', marginTop: 8, textAlign: 'center' },
});
