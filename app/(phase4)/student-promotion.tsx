import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

interface PromotionStudent {
  id: string;
  studentId: string;
  name: string;
  studentCode: string;
  currentClass?: string;
  currentSection?: string;
  status?: string;
}

interface PromotionHistory {
  id: string;
  studentName: string;
  fromClass: string;
  toClass: string;
  promotedAt: string;
  status: string;
}

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

export default function StudentPromotionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [candidates, setCandidates] = useState<PromotionStudent[]>([]);
  const [history, setHistory] = useState<PromotionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [nextClasses, setNextClasses] = useState<{ id: string; name: string; sections: { id: string; name: string }[] }[]>([]);
  const [tab, setTab] = useState<'candidates' | 'history'>('candidates');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      const arr = extractList(res);
      setClasses(arr.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (e) { console.error('Failed to load classes:', e); }
  }, []);

  const fetchCandidates = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get(`/promotion/candidates/${selectedClassId}`);
      setCandidates(extractList(res) as PromotionStudent[]);
    } catch (e) { console.error('Failed to load candidates:', e); }
  }, [selectedClassId]);

  const fetchNextClasses = useCallback(async () => {
    if (!selectedClassId) return;
    try {
      const res = await api.get(`/promotion/next-classes/${selectedClassId}`);
      setNextClasses(extractList(res) as { id: string; name: string; sections: { id: string; name: string }[] }[]);
    } catch (e) { console.error('Failed to load next classes:', e); }
  }, [selectedClassId]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/promotion/history');
      setHistory(extractList(res) as PromotionHistory[]);
    } catch (e) { console.error('Failed to load history:', e); }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchClasses(), fetchHistory()]);
    setLoading(false);
  }, [fetchClasses, fetchHistory]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (selectedClassId) {
      fetchCandidates();
      fetchNextClasses();
    }
  }, [selectedClassId, fetchCandidates, fetchNextClasses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAll(), selectedClassId ? fetchCandidates() : Promise.resolve()]);
    setRefreshing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const promoteSingle = async (studentId: string) => {
    if (!targetClassId || !targetSectionId) {
      Alert.alert('Error', 'Select a target class and section first.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/promotion/single', { studentId, targetClassId, targetSectionId });
      Alert.alert('Success', 'Student promoted successfully.');
      setCandidates(prev => prev.filter(c => c.id !== studentId));
      setSelectedIds(prev => prev.filter(id => id !== studentId));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Promotion failed.');
    } finally { setActionLoading(false); }
  };

  const promoteBulk = async () => {
    if (selectedIds.length === 0) { Alert.alert('Error', 'Select at least one student.'); return; }
    if (!targetClassId || !targetSectionId) { Alert.alert('Error', 'Select a target class and section.'); return; }
    setActionLoading(true);
    try {
      await api.post('/promotion/bulk', { studentIds: selectedIds, targetClassId, targetSectionId });
      Alert.alert('Success', `${selectedIds.length} students promoted.`);
      setCandidates(prev => prev.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Bulk promotion failed.');
    } finally { setActionLoading(false); }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Student Promotion</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Student Promotion</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'candidates' && styles.activeTab]} onPress={() => setTab('candidates')}>
          <Text style={[styles.tabText, tab === 'candidates' && styles.activeTabText]}>Candidates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.activeTab]} onPress={() => setTab('history')}>
          <Text style={[styles.tabText, tab === 'history' && styles.activeTabText]}>History</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {tab === 'candidates' ? (
          <>
            <View style={styles.selectorRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity style={[styles.classChip, !selectedClassId && styles.activeChip]} onPress={() => setSelectedClassId('')}>
                  <Text style={[styles.chipText, !selectedClassId && styles.activeChipText]}>Select Class</Text>
                </TouchableOpacity>
                {classes.map(c => (
                  <TouchableOpacity key={c.id} style={[styles.classChip, selectedClassId === c.id && styles.activeChip]} onPress={() => setSelectedClassId(c.id)}>
                    <Text style={[styles.chipText, selectedClassId === c.id && styles.activeChipText]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedClassId && (
              <View style={styles.targetSection}>
                <Text style={styles.sectionLabel}>Target: {selectedClass?.name} →</Text>
                <View style={styles.pickerRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {nextClasses.map(nc => (
                      <TouchableOpacity key={nc.id} style={[styles.smallChip, targetClassId === nc.id && styles.activeChip]} onPress={() => { setTargetClassId(nc.id); setTargetSectionId(nc.sections?.[0]?.id || ''); }}>
                        <Text style={[styles.smallChipText, targetClassId === nc.id && styles.activeChipText]}>{nc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                {targetClassId && nextClasses.find(nc => nc.id === targetClassId)?.sections && (
                  <View style={styles.pickerRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {(nextClasses.find(nc => nc.id === targetClassId)?.sections || []).map((s: any) => (
                        <TouchableOpacity key={s.id} style={[styles.smallChip, targetSectionId === s.id && styles.activeChip]} onPress={() => setTargetSectionId(s.id)}>
                          <Text style={[styles.smallChipText, targetSectionId === s.id && styles.activeChipText]}>{s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {selectedIds.length > 0 && (
              <View style={styles.bulkBar}>
                <Text style={styles.bulkText}>{selectedIds.length} selected</Text>
                <TouchableOpacity style={styles.bulkBtn} onPress={promoteBulk} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.bulkBtnText}>Promote All</Text>}
                </TouchableOpacity>
              </View>
            )}

            {!selectedClassId ? (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>Select a Class</Text>
                <Text style={styles.emptyText}>Choose a class above to see promotion candidates.</Text>
              </View>
            ) : candidates.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Candidates</Text>
                <Text style={styles.emptyText}>All students in this class are up to date.</Text>
              </View>
            ) : (
              candidates.map(student => (
                <View key={student.id} style={styles.studentCard}>
                  <TouchableOpacity style={styles.checkRow} onPress={() => toggleSelect(student.id)}>
                    <Ionicons name={selectedIds.includes(student.id) ? 'checkbox' : 'square-outline'} size={22} color={selectedIds.includes(student.id) ? '#e35336' : '#D1D5DB'} />
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentCode}>{student.studentCode} · {student.currentClass || selectedClass?.name}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.promoteBtn} onPress={() => promoteSingle(student.id)} disabled={actionLoading}>
                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : (
          history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No History</Text>
              <Text style={styles.emptyText}>No promotions have been recorded yet.</Text>
            </View>
          ) : (
            history.map(h => (
              <View key={h.id} style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <Ionicons name="swap-horizontal" size={20} color="#e35336" />
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyName}>{h.studentName}</Text>
                    <Text style={styles.historyDetail}>{h.fromClass} → {h.toClass}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDate}>{formatDate(h.promotedAt)}</Text>
                    <View style={[styles.historyBadge, { backgroundColor: h.status === 'ACTIVE' ? '#D1FAE5' : '#F3F4F6' }]}>
                      <Text style={[styles.historyBadgeText, { color: h.status === 'ACTIVE' ? '#065F46' : '#6B7280' }]}>{h.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#e35336' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  selectorRow: { marginBottom: 12 },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  activeChip: { backgroundColor: '#e35336', borderColor: '#e35336' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  activeChipText: { color: '#FFFFFF' },
  targetSection: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 12, gap: 8 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap' },
  smallChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  smallChipText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  bulkText: { fontSize: 14, fontWeight: '600', color: '#991B1B' },
  bulkBtn: { backgroundColor: '#e35336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bulkBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8 },
  checkRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  studentCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  promoteBtn: { backgroundColor: '#e35336', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyInfo: { flex: 1 },
  historyName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  historyDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  historyMeta: { alignItems: 'flex-end', gap: 4 },
  historyDate: { fontSize: 11, color: '#9CA3AF' },
  historyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  historyBadgeText: { fontSize: 10, fontWeight: '600' },
});
