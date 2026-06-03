import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, ActivityIndicator, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api/core';

interface Communication {
  id: string;
  subject: string;
  message: string;
  category?: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
  createdAt: string;
  student?: { id: string; name: string };
  creator?: { id: string; name: string };
  replies?: { id: string; message: string; createdAt: string; creator?: { name: string } }[];
}

const CATEGORIES = ['Academic', 'Behavior', 'Attendance', 'General'];

const StatusIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  OPEN: 'ellipse',
  ACKNOWLEDGED: 'checkmark-circle',
  CLOSED: 'lock-closed',
};

const StatusColors: Record<string, string> = {
  OPEN: '#F59E0B',
  ACKNOWLEDGED: '#3B82F6',
  CLOSED: '#6B7280',
};

export default function CommunicationsScreen() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({ subject: '', message: '', category: 'General', studentId: '' });
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      const res = await api.get('/communications', { params });
      const data = res.data?.data || res.data || [];
      setCommunications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load communications:', error);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSend = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      Alert.alert('Error', 'Please fill in subject and message');
      return;
    }
    setSending(true);
    try {
      await api.post('/communications', form);
      Alert.alert('Success', 'Communication sent successfully');
      setShowModal(false);
      setForm({ subject: '', message: '', category: 'General', studentId: '' });
      fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to send communication');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (commId: string) => {
    Alert.prompt?.('Reply', 'Enter your reply:', async (replyText: string) => {
      if (!replyText?.trim()) return;
      try {
        await api.post(`/communications/${commId}/reply`, { message: replyText });
        fetchData();
      } catch (error: any) {
        Alert.alert('Error', 'Failed to send reply');
      }
    });
  };

  const canSendCommunication = user && ['TEACHER', 'ADMIN', 'IT_MANAGER'].includes(user.role);
  const canReply = user && ['TEACHER', 'ADMIN', 'IT_MANAGER', 'PARENT'].includes(user.role);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communication Book</Text>
        {canSendCommunication && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !filterCategory && styles.activeFilter]} onPress={() => setFilterCategory(null)}>
          <Text style={[styles.filterText, !filterCategory && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat} style={[styles.filterChip, filterCategory === cat && styles.activeFilter]} onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}>
            <Text style={[styles.filterText, filterCategory === cat && styles.activeFilterText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={communications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.commCard}>
            <View style={styles.commHeader}>
              <View style={styles.commIcon}>
                <Ionicons name="chatbubble-ellipses" size={20} color="#e35336" />
              </View>
              <View style={styles.commInfo}>
                <Text style={styles.commSubject}>{item.subject}</Text>
                <Text style={styles.commMeta}>
                  {item.category} · {item.creator?.name || 'Unknown'}
                </Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: StatusColors[item.status] }]}>
                <Ionicons name={StatusIcons[item.status] || 'ellipse'} size={12} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.commMessage} numberOfLines={2}>{item.message}</Text>
            {item.replies && item.replies.length > 0 && (
              <View style={styles.repliesSection}>
                <Text style={styles.repliesLabel}>{item.replies.length} reply(ies)</Text>
                {item.replies.slice(0, 2).map((reply, idx) => (
                  <View key={idx} style={styles.replyItem}>
                    <Text style={styles.replyAuthor}>{reply.creator?.name || 'User'}: </Text>
                    <Text style={styles.replyText} numberOfLines={1}>{reply.message}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.commFooter}>
              <Text style={styles.commDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              {canReply && item.status !== 'CLOSED' && (
                <TouchableOpacity style={styles.replyBtn} onPress={() => handleReply(item.id)}>
                  <Ionicons name="return-up-back" size={14} color="#e35336" />
                  <Text style={styles.replyBtnText}>Reply</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} /> : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No communications found</Text>
            </View>
          )
        }
      />

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Communication</Text>
            <TouchableOpacity onPress={handleSend} disabled={sending}>
              {sending ? <ActivityIndicator size="small" color="#e35336" /> : <Text style={styles.modalSend}>Send</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.modalForm}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.catChip, form.category === cat && styles.catChipActive]} onPress={() => setForm((f) => ({ ...f, category: cat }))}>
                  <Text style={[styles.catText, form.category === cat && styles.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.modalInput} placeholder="Subject" placeholderTextColor="#9CA3AF" value={form.subject} onChangeText={(v) => setForm((f) => ({ ...f, subject: v }))} />
            <TextInput style={[styles.modalInput, styles.modalTextArea]} placeholder="Message" placeholderTextColor="#9CA3AF" value={form.message} onChangeText={(v) => setForm((f) => ({ ...f, message: v }))} multiline numberOfLines={5} textAlignVertical="top" />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  activeFilter: { backgroundColor: '#e35336' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  activeFilterText: { color: '#FFFFFF' },
  listContent: { padding: 16, gap: 12 },
  commCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  commHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  commIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  commInfo: { flex: 1 },
  commSubject: { fontSize: 15, fontWeight: '600', color: '#111827' },
  commMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  statusDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  commMessage: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  repliesSection: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, gap: 6 },
  repliesLabel: { fontSize: 12, fontWeight: '600', color: '#374151' },
  replyItem: { flexDirection: 'row' },
  replyAuthor: { fontSize: 12, fontWeight: '600', color: '#374151' },
  replyText: { fontSize: 12, color: '#6B7280', flex: 1 },
  commFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  commDate: { fontSize: 12, color: '#9CA3AF' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FEE2E2' },
  replyBtnText: { fontSize: 12, fontWeight: '600', color: '#e35336' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalCancel: { fontSize: 16, color: '#6B7280' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSend: { fontSize: 16, fontWeight: '600', color: '#e35336' },
  modalForm: { flex: 1, padding: 16, gap: 12 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  catText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  catTextActive: { color: '#FFFFFF' },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  modalTextArea: { minHeight: 120, paddingTop: 14 },
});
