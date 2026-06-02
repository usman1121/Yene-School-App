import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  priority?: 'high' | 'medium' | 'low';
  authorName?: string;
}

const PRIORITY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: '#FEE2E2', text: '#991B1B', label: 'HIGH' },
  medium: { bg: '#FEF3C7', text: '#92400E', label: 'MED' },
  low: { bg: '#D1FAE5', text: '#065F46', label: 'LOW' },
};

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const canCreate = user && ['TEACHER', 'ADMIN', 'IT_MANAGER'].includes(user.role);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(extractList(res) as Announcement[]);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) {
      Alert.alert('Validation', 'Title and content are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/announcements', {
        title: formTitle.trim(),
        content: formContent.trim(),
        priority: formPriority,
      });
      setShowForm(false);
      setFormTitle('');
      setFormContent('');
      setFormPriority('medium');
      Alert.alert('Success', 'Announcement created successfully.');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => {
    const pStyle = PRIORITY_STYLES[item.priority || 'low'];
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg }]}>
            <Text style={[styles.priorityText, { color: pStyle.text }]}>{pStyle.label}</Text>
          </View>
        </View>
        <Text style={styles.cardContent} numberOfLines={3}>{item.content}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.cardMeta}>
            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
          {item.authorName && (
            <View style={styles.cardMeta}>
              <Ionicons name="person-outline" size={12} color="#9CA3AF" />
              <Text style={styles.metaText}>{item.authorName}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        {canCreate ? (
          <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
            <Ionicons name="add-circle" size={28} color="#e35336" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          )
        }
      />

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Announcement</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#9CA3AF"
                value={formTitle}
                onChangeText={setFormTitle}
                returnKeyType="next"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Content"
                placeholderTextColor="#9CA3AF"
                value={formContent}
                onChangeText={setFormContent}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={styles.priorityLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => {
                  const ps = PRIORITY_STYLES[p];
                  const active = formPriority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityOption, { backgroundColor: active ? ps.bg : '#F3F4F6', borderColor: active ? ps.text : '#E2E8F0' }]}
                      onPress={() => setFormPriority(p)}
                    >
                      <Text style={[styles.priorityOptionText, { color: active ? ps.text : '#6B7280' }]}>{ps.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Announcement</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardContent: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  cardFooter: { flexDirection: 'row', gap: 16, marginTop: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  textArea: { minHeight: 100 },
  priorityLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  priorityOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
  priorityOptionText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  submitBtn: { backgroundColor: '#e35336', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
