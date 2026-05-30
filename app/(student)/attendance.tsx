import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { studentApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { AttendanceRecord } from '@/types';

export default function StudentAttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [recordsRes, summaryRes] = await Promise.allSettled([
        studentApi.getMyAttendance(),
        studentApi.getMyAttendanceSummary(),
      ]);
      if (recordsRes.status === 'fulfilled') setRecords(unwrapArray<AttendanceRecord>(recordsRes.value));
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data || summaryRes.value);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
  const rate = summary?.rate ?? summary?.percentage ?? (records.length > 0 ? Math.round((presentCount / records.length) * 100) : null);

  const formatDate = (date: string) => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return date; }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PRESENT': return { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle' as const };
      case 'ABSENT': return { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle' as const };
      case 'LATE': return { bg: '#FEF3C7', text: '#92400E', icon: 'time' as const };
      case 'EXCUSED': return { bg: '#EFF6FF', text: '#1E40AF', icon: 'information-circle' as const };
      default: return { bg: '#F3F4F6', text: '#6B7280', icon: 'remove-circle' as const };
    }
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
        <Text style={styles.headerTitle}>My Attendance</Text>
        <Text style={styles.headerSubtext}>Rate: {rate !== null ? `${rate}%` : 'N/A'}</Text>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}><Text style={styles.statValue}>{presentCount}</Text><Text style={styles.statLabel}>Present</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}><Text style={styles.statValue}>{absentCount}</Text><Text style={styles.statLabel}>Absent</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}><Text style={styles.statValue}>{lateCount}</Text><Text style={styles.statLabel}>Late</Text></View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}><Text style={styles.statValue}>{excusedCount}</Text><Text style={styles.statLabel}>Excused</Text></View>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No attendance records</Text>
          </View>
        ) : (
          records.map((record) => {
            const ss = getStatusStyle(record.status);
            return (
              <View key={record.id} style={styles.recordCard}>
                <Ionicons name={ss.icon} size={20} color={ss.text} />
                <View style={styles.recordInfo}>
                  <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                  <Text style={[styles.recordStatus, { color: ss.text }]}>{record.status}</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statsBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: '#E5E7EB' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  recordCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8, gap: 12 },
  recordInfo: { flex: 1 },
  recordDate: { fontSize: 14, fontWeight: '500', color: '#111827' },
  recordStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
