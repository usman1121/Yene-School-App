import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { parentAttendanceAPI } from '@/lib/api/parent';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { AttendanceRecord } from '@/types';

export default function ChildAttendanceScreen() {
  const { childId, name } = useLocalSearchParams();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await parentAttendanceAPI.getChildAttendance(childId as string);
      const records = unwrapArray<any>(res).map((record) => ({
        ...record,
        id: record.id || `${record.date}-${record.status}`,
        date: record.date || record.createdAt,
      }));
      setRecords(records);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return { name: 'checkmark-circle', color: '#10B981' };
      case 'ABSENT': return { name: 'close-circle', color: '#EF4444' };
      case 'LATE': return { name: 'time', color: '#F59E0B' };
      case 'EXCUSED': return { name: 'information-circle', color: '#3B82F6' };
      default: return { name: 'help-circle', color: '#9CA3AF' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{attendanceRate}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{presentCount}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{absentCount}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{lateCount}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
      </View>

      {/* Records */}
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const icon = getStatusIcon(item.status);
          return (
            <View style={styles.recordCard}>
              <View style={[styles.recordIcon, { backgroundColor: `${icon.color}15` }]}>
                <Ionicons name={icon.name as any} size={20} color={icon.color} />
              </View>
              <View style={styles.recordInfo}>
                <Text style={styles.recordStatus}>{item.status}</Text>
                <Text style={styles.recordDate}>{formatDate(item.date)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No attendance records</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E5E7EB',
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
