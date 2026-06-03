import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface EntryProgressItem {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  totalStudents: number;
  gradedStudents: number;
  completionPercent: number;
}

interface ProgressStats {
  totalEntries: number;
  completed: number;
  pending: number;
  overallPercent: number;
}

export default function EntryProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [progress, setProgress] = useState<EntryProgressItem[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classFilter, setClassFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (classFilter) params.classId = classFilter;
      const res = await api.get('/grading/admin/entry-progress', { params });
      const data = res.data?.data || res.data || [];
      const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
      setProgress(items);

      const total = items.length;
      const completed = items.filter((i: EntryProgressItem) => i.completionPercent >= 100).length;
      const pending = items.filter((i: EntryProgressItem) => i.completionPercent < 100).length;
      const overallPercent = total > 0 ? Math.round(items.reduce((s: number, i: EntryProgressItem) => s + (i.completionPercent || 0), 0) / total) : 0;
      setStats({ totalEntries: total, completed, pending, overallPercent });
    } catch (error) {
      console.error('Failed to load entry progress:', error);
    } finally {
      setLoading(false);
    }
  }, [classFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const sendReminder = async (teacherId: string, classId: string, subjectId: string) => {
    try {
      await api.post('/grading/admin/send-reminder', { teacherId, classId, subjectId });
      Alert.alert('Success', 'Reminder sent to teacher.');
    } catch {
      Alert.alert('Error', 'Failed to send reminder.');
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent < 30) return '#EF4444';
    if (percent < 70) return '#F59E0B';
    return '#10B981';
  };

  const getProgressBg = (percent: number) => {
    if (percent < 30) return '#FEE2E2';
    if (percent < 70) return '#FEF3C7';
    return '#D1FAE5';
  };

  const uniqueClasses = Array.from(new Set(progress.map((p) => p.className))).sort();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry Progress</Text>
        <View style={styles.backBtn} />
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#e35336' }]}>{stats.overallPercent}%</Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity
            style={[styles.filterChip, !classFilter && styles.filterChipActive]}
            onPress={() => setClassFilter('')}
          >
            <Text style={[styles.filterChipText, !classFilter && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {uniqueClasses.map((cls) => (
            <TouchableOpacity
              key={cls}
              style={[styles.filterChip, classFilter === cls && styles.filterChipActive]}
              onPress={() => setClassFilter(classFilter === cls ? '' : cls)}
            >
              <Text style={[styles.filterChipText, classFilter === cls && styles.filterChipTextActive]}>{cls}</Text>
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
        ) : progress.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No entry progress data</Text>
          </View>
        ) : (
          progress.map((item, index) => {
            const color = getProgressColor(item.completionPercent);
            const bg = getProgressBg(item.completionPercent);
            return (
              <View key={`${item.classId}-${item.subjectId}-${index}`} style={styles.progressCard}>
                <View style={styles.progressTop}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.subjectName}>{item.subjectName}</Text>
                    <Text style={styles.className}>{item.className}</Text>
                    <Text style={styles.teacherName}>{item.teacherName}</Text>
                  </View>
                  <View style={[styles.percentBadge, { backgroundColor: bg }]}>
                    <Text style={[styles.percentText, { color }]}>{item.completionPercent}%</Text>
                  </View>
                </View>
                <View style={styles.barOuter}>
                  <View style={[styles.barInner, { width: `${Math.min(item.completionPercent, 100)}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.progressBottom}>
                  <Text style={styles.progressMeta}>
                    {item.gradedStudents} / {item.totalStudents} graded
                  </Text>
                  {item.completionPercent < 100 && (
                    <TouchableOpacity
                      style={styles.remindBtn}
                      onPress={() => sendReminder(item.teacherId, item.classId, item.subjectId)}
                    >
                      <Ionicons name="notifications-outline" size={14} color="#e35336" />
                      <Text style={styles.remindBtnText}>Remind</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e35336' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  progressCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressInfo: { flex: 1, gap: 2 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  className: { fontSize: 12, color: '#6B7280' },
  teacherName: { fontSize: 12, color: '#9CA3AF' },
  percentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  percentText: { fontSize: 14, fontWeight: '700' },
  barOuter: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  barInner: { height: '100%', borderRadius: 4 },
  progressBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  progressMeta: { fontSize: 11, color: '#9CA3AF' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e35336' },
  remindBtnText: { fontSize: 11, fontWeight: '600', color: '#e35336' },
});
