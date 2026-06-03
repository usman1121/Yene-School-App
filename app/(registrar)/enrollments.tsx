import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { registrarApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { Enrollment } from '@/types';

export default function RegistrarEnrollmentsScreen() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('PENDING');

  const fetchEnrollments = useCallback(async () => {
    try {
      const res = await registrarApi.enrollments.getAll({ status: filter });
      setEnrollments(unwrapArray<Enrollment>(res));
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEnrollments();
    setRefreshing(false);
  }, [fetchEnrollments]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF3C7', text: '#92400E' };
      case 'APPROVED': return { bg: '#D1FAE5', text: '#065F46' };
      case 'REJECTED': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const handleApprove = (enrollment: Enrollment) => {
    Alert.alert('Approve Enrollment', `Approve enrollment for ${enrollment.studentName || 'this student'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try {
            await registrarApi.enrollments.autoApprove(enrollment.id);
            Alert.alert('Success', 'Enrollment approved');
            fetchEnrollments();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to approve');
          }
        },
      },
    ]);
  };

  const handleReject = (enrollment: Enrollment) => {
    Alert.alert('Reject Enrollment', `Reject enrollment for ${enrollment.studentName || 'this student'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await registrarApi.enrollments.reject(enrollment.id, 'Rejected by registrar');
            Alert.alert('Rejected', 'Enrollment rejected');
            fetchEnrollments();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Enrollments</Text>
        <Text style={styles.headerSubtext}>{enrollments.length} enrollment(s)</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['PENDING', 'APPROVED', 'REJECTED'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filter === s && styles.filterChipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {enrollments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {filter.toLowerCase()} enrollments</Text>
          </View>
        ) : (
          enrollments.map((enr) => {
            const ss = getStatusStyle(enr.status);
            return (
              <View key={enr.id} style={styles.enrollmentCard}>
                <View style={styles.enrollmentHeader}>
                  <View style={styles.enrollmentInfo}>
                    <Text style={styles.studentName}>{enr.studentName || 'Unknown Student'}</Text>
                    <Text style={styles.studentEmail}>{enr.studentEmail || ''}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: ss.bg }]}>
                    <Text style={[styles.statusText, { color: ss.text }]}>{enr.status}</Text>
                  </View>
                </View>
                {enr.createdAt && (
                  <Text style={styles.dateText}>Applied: {new Date(enr.createdAt).toLocaleDateString()}</Text>
                )}
                {filter === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(enr)}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(enr)}>
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
  filterBar: { paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  filterText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  enrollmentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  enrollmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  enrollmentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  studentEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  dateText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 8 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#EF4444', borderRadius: 8, paddingVertical: 8 },
  actionBtnText: { fontSize: 13, color: '#FFFFFF', fontWeight: '600' },
});
