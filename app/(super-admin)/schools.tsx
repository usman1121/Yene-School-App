import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { superAdminApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { School } from '@/types';

export default function SuperAdminSchoolsScreen() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await superAdminApi.schools.list();
      setSchools(unwrapArray<School>(res));
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSchools();
    setRefreshing(false);
  }, [fetchSchools]);

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
        <Text style={styles.headerTitle}>Schools</Text>
        <Text style={styles.headerSubtext}>{schools.length} school(s)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {schools.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No schools registered</Text>
          </View>
        ) : (
          schools.map((school) => (
            <View key={school.id} style={styles.schoolCard}>
              <View style={styles.schoolHeader}>
                <View style={styles.schoolAvatar}>
                  <Text style={styles.schoolInitial}>{(school.name || 'S').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName}>{school.name}</Text>
                  <Text style={styles.schoolEmail}>{school.email}</Text>
                </View>
                <View style={[styles.activeBadge, school.isActive ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.activeText, school.isActive ? { color: '#065F46' } : { color: '#991B1B' }]}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
              {school.phone && <Text style={styles.schoolDetail}>Phone: {school.phone}</Text>}
              {school.address && <Text style={styles.schoolDetail}>{school.address}</Text>}
            </View>
          ))
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
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  schoolCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  schoolHeader: { flexDirection: 'row', alignItems: 'center' },
  schoolAvatar: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  schoolInitial: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  schoolEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  activeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  schoolDetail: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
