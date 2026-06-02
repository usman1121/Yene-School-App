import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

interface PublishItem {
  id: string;
  className?: string;
  subjectName?: string;
  teacherName?: string;
  termName?: string;
  assessmentName?: string;
  status?: string;
  entryCount?: number;
  totalStudents?: number;
  publishedAt?: string;
}

interface EntryProgressItem {
  id: string;
  className: string;
  subjectName: string;
  teacherName: string;
  entryPercentage: number;
  totalEntries: number;
  completedEntries: number;
}

export default function PublishResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'checklist' | 'published' | 'progress'>('checklist');
  const [checklist, setChecklist] = useState<PublishItem[]>([]);
  const [publishedItems, setPublishedItems] = useState<PublishItem[]>([]);
  const [progressData, setProgressData] = useState<EntryProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChecklist = useCallback(async () => {
    const res = await api.get('/grading/admin/publish-checklist');
    setChecklist(extractList(res) as PublishItem[]);
  }, []);

  const fetchPublished = useCallback(async () => {
    const res = await api.get('/report-cards/publish-summary');
    setPublishedItems(extractList(res) as PublishItem[]);
  }, []);

  const fetchProgress = useCallback(async () => {
    const res = await api.get('/grading/admin/entry-progress');
    setProgressData(extractList(res) as EntryProgressItem[]);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchChecklist(), fetchPublished(), fetchProgress()]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [fetchChecklist, fetchPublished, fetchProgress]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([fetchChecklist(), fetchPublished(), fetchProgress()]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const publishItem = async (id: string) => {
    setActionLoading(true);
    try {
      await api.put('/report-cards/publish', { ids: [id] });
      Alert.alert('Success', 'Item published.');
      setChecklist(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Publish failed.');
    } finally { setActionLoading(false); }
  };

  const publishSelected = async () => {
    if (selectedIds.length === 0) { Alert.alert('Error', 'Select at least one item.'); return; }
    setActionLoading(true);
    try {
      await api.put('/report-cards/publish', { ids: selectedIds });
      Alert.alert('Success', `${selectedIds.length} items published.`);
      setChecklist(prev => prev.filter(i => !selectedIds.includes(i.id)));
      setSelectedIds([]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Bulk publish failed.');
    } finally { setActionLoading(false); }
  };

  const unpublishItem = async (id: string) => {
    setActionLoading(true);
    try {
      await api.put('/report-cards/unpublish', { ids: [id] });
      Alert.alert('Success', 'Item unpublished.');
      setPublishedItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Unpublish failed.');
    } finally { setActionLoading(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Publish Results</Text>
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
        <Text style={styles.headerTitle}>Publish Results</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'checklist' && styles.activeTab]} onPress={() => setTab('checklist')}>
          <Text style={[styles.tabText, tab === 'checklist' && styles.activeTabText]}>Checklist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'published' && styles.activeTab]} onPress={() => setTab('published')}>
          <Text style={[styles.tabText, tab === 'published' && styles.activeTabText]}>Published</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'progress' && styles.activeTab]} onPress={() => setTab('progress')}>
          <Text style={[styles.tabText, tab === 'progress' && styles.activeTabText]}>Progress</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tab === 'checklist' ? (
          <>
            {selectedIds.length > 0 && (
              <View style={styles.bulkBar}>
                <Text style={styles.bulkText}>{selectedIds.length} selected</Text>
                <TouchableOpacity style={styles.bulkBtn} onPress={publishSelected} disabled={actionLoading}>
                  {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.bulkBtnText}>Publish All</Text>}
                </TouchableOpacity>
              </View>
            )}
            {checklist.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>All Clear</Text>
                <Text style={styles.emptyText}>No items pending publication.</Text>
              </View>
            ) : (
              checklist.map(item => (
                <View key={item.id} style={styles.publishCard}>
                  <TouchableOpacity style={styles.checkRow} onPress={() => toggleSelect(item.id)}>
                    <Ionicons name={selectedIds.includes(item.id) ? 'checkbox' : 'square-outline'} size={22} color={selectedIds.includes(item.id) ? '#e35336' : '#D1D5DB'} />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.assessmentName || item.subjectName || 'Assessment'}</Text>
                      <Text style={styles.itemSub}>{item.className} · {item.subjectName} · {item.teacherName}</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => publishItem(item.id)} disabled={actionLoading}>
                    <Ionicons name="cloud-upload-outline" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : tab === 'published' ? (
          publishedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Published Items</Text>
              <Text style={styles.emptyText}>Publish results to see them here.</Text>
            </View>
          ) : (
            publishedItems.map(item => (
              <View key={item.id} style={styles.publishCard}>
                <View style={styles.publishedInfo}>
                  <View style={styles.publishedDot} />
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.assessmentName || item.subjectName || 'Published'}</Text>
                    <Text style={styles.itemSub}>{item.className} · {item.subjectName}</Text>
                    {item.publishedAt && <Text style={styles.publishedDate}>Published {formatDate(item.publishedAt)}</Text>}
                  </View>
                </View>
                <TouchableOpacity style={styles.unpublishBtn} onPress={() => unpublishItem(item.id)} disabled={actionLoading}>
                  <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )
        ) : (
          progressData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Progress Data</Text>
              <Text style={styles.emptyText}>Entry progress will appear once grading begins.</Text>
            </View>
          ) : (
            progressData.map(item => (
              <View key={item.id} style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressSubject}>{item.subjectName}</Text>
                  <Text style={styles.progressPercent}>{item.entryPercentage}%</Text>
                </View>
                <Text style={styles.progressClass}>{item.className} · {item.teacherName}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(item.entryPercentage, 100)}%` }]} />
                </View>
                <Text style={styles.progressCount}>{item.completedEntries}/{item.totalEntries} entries</Text>
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
  tabText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  bulkBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEE2E2', borderRadius: 10, padding: 12, marginBottom: 12 },
  bulkText: { fontSize: 14, fontWeight: '600', color: '#991B1B' },
  bulkBtn: { backgroundColor: '#e35336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bulkBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
  retryBtn: { marginTop: 12, backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  publishCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  checkRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  actionBtn: { backgroundColor: '#22C55E', width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  publishedInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  publishedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  publishedDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  unpublishBtn: { padding: 6 },
  progressCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressSubject: { fontSize: 15, fontWeight: '600', color: '#111827' },
  progressPercent: { fontSize: 15, fontWeight: '700', color: '#e35336' },
  progressClass: { fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 8 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: '#F1F5F9', overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#e35336' },
  progressCount: { fontSize: 11, color: '#9CA3AF', marginTop: 4, textAlign: 'right' },
});
