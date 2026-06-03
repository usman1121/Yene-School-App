import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { financeApi } from '@/api';
import { unwrapArray, unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';

export default function FinanceReportsScreen() {
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await financeApi.reports.daily();
      setDailyReport(res.data?.data || res.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  }, [fetchReports]);

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
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerSubtext}>Daily collection summary</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {dailyReport ? (
          <View style={styles.reportCard}>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Today's Collection</Text>
              <Text style={styles.reportValue}>{(dailyReport.totalCollection || dailyReport.total || 0).toLocaleString()} Br</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Transactions</Text>
              <Text style={styles.reportValue}>{dailyReport.transactionCount || dailyReport.count || 0}</Text>
            </View>
            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Date</Text>
              <Text style={styles.reportValue}>{dailyReport.date || new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No report data available</Text>
          </View>
        )}

        {dailyReport?.items && dailyReport.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            {dailyReport.items.map((item: any, index: number) => (
              <View key={index} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{item.label || item.name || ''}</Text>
                <Text style={styles.detailValue}>{(item.amount || item.value || 0).toLocaleString()} Br</Text>
              </View>
            ))}
          </View>
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
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  reportLabel: { fontSize: 14, color: '#6B7280' },
  reportValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, marginBottom: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  detailLabel: { fontSize: 13, color: '#6B7280' },
  detailValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
});
