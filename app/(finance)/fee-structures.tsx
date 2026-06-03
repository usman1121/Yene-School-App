import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { financeApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { FeeStructure } from '@/types';

export default function FinanceFeeStructuresScreen() {
  const [fees, setFees] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFees = useCallback(async () => {
    try {
      const res = await financeApi.feeStructures.list();
      setFees(unwrapArray<FeeStructure>(res));
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFees();
    setRefreshing(false);
  }, [fetchFees]);

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
        <Text style={styles.headerTitle}>Fee Structures</Text>
        <Text style={styles.headerSubtext}>{fees.length} fee structure(s)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {fees.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No fee structures defined</Text>
          </View>
        ) : (
          fees.map((fee) => (
            <View key={fee.id} style={styles.feeCard}>
              <View style={styles.feeHeader}>
                <Text style={styles.feeName}>{fee.name}</Text>
                <Text style={styles.feeAmount}>{fee.amount.toLocaleString()} Br</Text>
              </View>
              {fee.gradeLevel && <Text style={styles.feeGrade}>Grade: {fee.gradeLevel}</Text>}
              <Text style={styles.feeMeta}>Per {fee.termId ? 'term' : 'year'}</Text>
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
  feeCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  feeAmount: { fontSize: 18, fontWeight: 'bold', color: '#e35336' },
  feeGrade: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  feeMeta: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
});
