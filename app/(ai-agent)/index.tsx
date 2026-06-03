import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/core';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_ACTIONS = [
  { label: 'Show my schedule', query: 'What is my schedule today?' },
  { label: 'Recent grades', query: 'Show me my recent grades' },
  { label: 'Attendance summary', query: 'What is my attendance rate?' },
  { label: 'Upcoming exams', query: 'What exams are coming up?' },
];

export default function AiAgentScreen() {
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: "I'm your AI assistant. I can help you with schedules, grades, attendance, and more. Try one of the suggestions below or type your question!",
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const role = user?.role || 'USER';
      const response = await api.post('/ai-agent/query', {
        query: text.trim(),
        role,
        schoolId: user?.schoolId,
      });

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.data?.message || response.data?.response || "I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting. Please check your network and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Ionicons name="sparkles" size={20} color="#FCD34D" />
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        renderItem={({ item }) => (
          <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
            {item.role === 'assistant' && (
              <View style={styles.assistantAvatar}>
                <Ionicons name="sparkles" size={16} color="#e35336" />
              </View>
            )}
            <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.messageText, item.role === 'user' && styles.userMessageText]}>
                {item.content}
              </Text>
              <Text style={[styles.timestamp, item.role === 'user' && styles.userTimestamp]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        )}
        ListHeaderComponent={
          messages.length === 1 ? (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Suggested Actions</Text>
              <View style={styles.suggestionsGrid}>
                {SUGGESTED_ACTIONS.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(action.query)}
                  >
                    <Text style={styles.suggestionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#e35336" />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type your question..."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#e35336', paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: { width: 40 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  messagesContainer: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start', gap: 8 },
  assistantAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
  },
  messageBubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: '#e35336', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  messageText: { fontSize: 15, lineHeight: 20, color: '#374151' },
  userMessageText: { color: '#FFFFFF' },
  timestamp: { fontSize: 10, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
  userTimestamp: { color: '#FCA5A5' },
  suggestionsContainer: { marginBottom: 16 },
  suggestionsTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 8 },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
  },
  suggestionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 8 },
  loadingText: { fontSize: 13, color: '#6B7280' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100,
    backgroundColor: '#F9FAFB', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#111827', marginRight: 8,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#e35336',
    justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
