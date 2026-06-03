import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import api from '@/api/client';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import type { Conversation, Message } from '@/types';

export default function MessagingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(unwrapArray<Conversation>(res));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return dateString; }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {user && (user.role === 'STUDENT' || user.role === 'PARENT') && (
        <View style={styles.restrictedBanner}>
          <Ionicons name="lock-closed" size={16} color="#92400E" />
          <Text style={styles.restrictedText}>Messaging is only available for staff</Text>
        </View>
      )}

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No conversations</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity key={conv.id} style={styles.convCard}>
              <View style={styles.convAvatar}>
                <Text style={styles.convInitial}>
                  {conv.participants?.find((p) => p.id !== user?.id)?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.convInfo}>
                <View style={styles.convHeader}>
                  <Text style={styles.convName} numberOfLines={1}>
                    {conv.participants?.filter((p) => p.id !== user?.id).map((p) => p.name).join(', ') || 'Unknown'}
                  </Text>
                  {conv.lastMessage && <Text style={styles.convTime}>{formatTime(conv.lastMessage.createdAt)}</Text>}
                </View>
                <Text style={styles.convLastMsg} numberOfLines={1}>
                  {conv.lastMessage?.content || 'No messages yet'}
                </Text>
                {conv.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadCount}>{conv.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  restrictedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FDE68A' },
  restrictedText: { fontSize: 13, color: '#92400E', fontWeight: '500', flex: 1 },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  convAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  convInitial: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  convInfo: { flex: 1 },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  convName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  convTime: { fontSize: 11, color: '#9CA3AF' },
  convLastMsg: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  unreadBadge: { backgroundColor: '#e35336', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  unreadCount: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
});
