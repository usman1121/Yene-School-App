import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

interface SeatingPlan {
  id: string;
  examType: string;
  className?: string;
  sectionName?: string;
  status: 'DRAFT' | 'GENERATED';
  totalStudents?: number;
  createdAt: string;
  examDate?: string;
  room?: string;
}

interface SeatingDetail {
  id: string;
  examType: string;
  className?: string;
  sectionName?: string;
  status: string;
  totalStudents: number;
  seats?: { row: number; col: number; studentName?: string; rollNumber?: string }[];
}

const EXAM_TYPES = ['MID_TERM', 'FINAL', 'QUIZ', 'PRACTICAL', 'ASSIGNMENT'];

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any => {
  return res?.data?.data ?? res?.data ?? res ?? null;
};

export default function ExamSeatingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<SeatingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SeatingDetail | null>(null);
  const [newPlan, setNewPlan] = useState({ examType: 'MID_TERM', classId: '', sectionId: '', examDate: '', room: '' });
  const [saving, setSaving] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/exams/seating/plans', { params: filterType ? { examType: filterType } : {} });
      setPlans(extractList(res) as SeatingPlan[]);
    } catch (error) {
      console.error('Failed to fetch seating plans:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlans();
    setRefreshing(false);
  };

  const viewDetail = async (id: string) => {
    try {
      const res = await api.get(`/exams/seating/plan/${id}`);
      setSelectedDetail(extractData(res) as SeatingDetail);
      setDetailModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load seating detail');
    }
  };

  const generateSeating = async (id: string) => {
    try {
      await api.post(`/exams/seating/plan/${id}/generate`);
      Alert.alert('Success', 'Seating plan generated');
      fetchPlans();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate seating plan');
    }
  };

  const deletePlan = (id: string) => {
    Alert.alert('Delete Plan', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/exams/seating/plan/${id}`);
          Alert.alert('Success', 'Plan deleted');
          fetchPlans();
        } catch { Alert.alert('Error', 'Failed to delete plan'); }
      }},
    ]);
  };

  const createPlan = async () => {
    if (!newPlan.classId || !newPlan.sectionId || !newPlan.examDate) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/exams/seating/type/${newPlan.examType}/seating-plan`, newPlan);
      setModalVisible(false);
      setNewPlan({ examType: 'MID_TERM', classId: '', sectionId: '', examDate: '', room: '' });
      Alert.alert('Success', 'Seating plan created');
      fetchPlans();
    } catch (error) {
      Alert.alert('Error', 'Failed to create seating plan');
    } finally {
      setSaving(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'GENERATED': return { bg: '#D1FAE5', text: '#065F46' };
      default: return { bg: '#FEF3C7', text: '#92400E' };
    }
  };

  const formatDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exam Seating</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity style={[styles.filterChip, !filterType && styles.filterChipActive]} onPress={() => setFilterType('')}>
            <Text style={[styles.filterChipText, !filterType && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {EXAM_TYPES.map((t) => (
            <TouchableOpacity key={t} style={[styles.filterChip, filterType === t && styles.filterChipActive]} onPress={() => setFilterType(t)}>
              <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>{t.replace('_', ' ')}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No seating plans found</Text>
            <Text style={styles.emptySubtext}>Tap + to create a new plan</Text>
          </View>
        ) : (
          plans.map((plan) => {
            const status = getStatusStyle(plan.status);
            return (
              <TouchableOpacity key={plan.id} style={styles.planCard} onPress={() => viewDetail(plan.id)} activeOpacity={0.7}>
                <View style={styles.planHeader}>
                  <View style={styles.planIcon}>
                    <Ionicons name="grid" size={20} color="#e35336" />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planTitle}>{plan.examType?.replace('_', ' ')}</Text>
                    <Text style={styles.planSubtitle}>{plan.className}{plan.sectionName ? ` - ${plan.sectionName}` : ''}</Text>
                  </View>
                  <TouchableOpacity style={styles.planAction} onPress={() => deletePlan(plan.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <View style={styles.planMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{plan.status}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{plan.totalStudents ?? 0} students</Text>
                  </View>
                  {plan.examDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{formatDate(plan.examDate)}</Text>
                    </View>
                  )}
                </View>
                {plan.status === 'DRAFT' && (
                  <TouchableOpacity style={styles.generateBtn} onPress={() => generateSeating(plan.id)}>
                    <Ionicons name="flash-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>Generate Seating</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Seating Plan</Text>
            <Text style={styles.modalLabel}>Exam Type</Text>
            <View style={styles.pickerRow}>
              {EXAM_TYPES.map((t) => (
                <TouchableOpacity key={t} style={[styles.pickerOption, newPlan.examType === t && styles.pickerOptionActive]} onPress={() => setNewPlan({ ...newPlan, examType: t })}>
                  <Text style={[styles.pickerOptionText, newPlan.examType === t && styles.pickerOptionTextActive]}>{t.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Class ID" value={newPlan.classId} onChangeText={(v) => setNewPlan({ ...newPlan, classId: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Section ID" value={newPlan.sectionId} onChangeText={(v) => setNewPlan({ ...newPlan, sectionId: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Exam Date (YYYY-MM-DD)" value={newPlan.examDate} onChangeText={(v) => setNewPlan({ ...newPlan, examDate: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Room (optional)" value={newPlan.room} onChangeText={(v) => setNewPlan({ ...newPlan, room: v })} placeholderTextColor="#9CA3AF" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={createPlan} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={detailModalVisible} animationType="slide" transparent onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>Seating Overview</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedDetail ? (
              <ScrollView style={styles.detailScroll}>
                <Text style={styles.detailInfo}>{selectedDetail.examType?.replace('_', ' ')} - {selectedDetail.className}{selectedDetail.sectionName ? ` (${selectedDetail.sectionName})` : ''}</Text>
                <Text style={styles.detailInfo}>Status: {selectedDetail.status} | Students: {selectedDetail.totalStudents}</Text>
                {selectedDetail.seats && selectedDetail.seats.length > 0 ? (
                  <View style={styles.seatsGrid}>
                    {selectedDetail.seats.map((seat, idx) => (
                      <View key={idx} style={styles.seatItem}>
                        <Text style={styles.seatLabel}>R{seat.row}C{seat.col}</Text>
                        <Text style={styles.seatName}>{seat.studentName || 'Empty'}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.noSeats}>No seats generated yet</Text>
                )}
              </ScrollView>
            ) : (
              <ActivityIndicator size="small" color="#e35336" style={{ marginTop: 20 }} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e35336' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16, gap: 12 },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  planInfo: { flex: 1 },
  planTitle: { fontSize: 15, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  planSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  planAction: { padding: 4 },
  planMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e35336', paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  generateBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  emptySubtext: { fontSize: 13, color: '#D1D5DB' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailScroll: { maxHeight: 400 },
  detailInfo: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  seatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  seatItem: { width: '30%', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  seatLabel: { fontSize: 10, fontWeight: '700', color: '#e35336' },
  seatName: { fontSize: 11, color: '#374151', marginTop: 2, textAlign: 'center' },
  noSeats: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
});
