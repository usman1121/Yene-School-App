import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

type TabKey = 'daily' | 'monthly' | 'outstanding' | 'overdue' | 'audit';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'daily', label: 'Daily', icon: 'today' },
  { key: 'monthly', label: 'Monthly', icon: 'calendar' },
  { key: 'outstanding', label: 'Outstanding', icon: 'alert-circle' },
  { key: 'overdue', label: 'Overdue', icon: 'warning' },
  { key: 'audit', label: 'Audit Logs', icon: 'document-text' },
];

interface ReportEntry {
  id: string;
  date?: string;
  month?: string;
  description: string;
  amount: number;
  paid: number;
  balance: number;
  status?: string;
  studentName?: string;
  className?: string;
  transactionRef?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
  entityType?: string;
}

export default function FinanceReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<{ total: number; collected: number; pending: number } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};

      if (activeTab === 'audit') {
        const res = await api.get('/finance/audit-logs', { params });
        const data = res.data?.data || res.data || [];
        setAuditLogs(Array.isArray(data) ? data : Array.isArray(data?.logs) ? data.logs : []);
        setEntries([]);
      } else {
        const endpointMap: Record<TabKey, string> = {
          daily: '/finance/reports/daily',
          monthly: '/finance/reports/monthly',
          outstanding: '/finance/reports/outstanding',
          overdue: '/finance/reports/overdue',
          audit: '/finance/audit-logs',
        };
        const res = await api.get(endpointMap[activeTab], { params });
        const data = res.data?.data || res.data || {};
        setEntries(Array.isArray(data) ? data : Array.isArray(data.entries) ? data.entries : []);
        setSummary(data.summary || null);
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleMarkOverdue = async (id: string) => {
    try {
      await api.post('/finance/fees/mark-overdue', { feeId: id });
      Alert.alert('Success', 'Fee marked as overdue.');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to mark overdue.');
    }
  };

  const handleViewHistory = (studentId: string) => {
    Alert.alert('History', `Viewing fee history for student ID: ${studentId}`);
  };

  const formatCurrency = (amount: number) => {
    return amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }) || '$0.00';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  };

  const getStatusStyle = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return { bg: '#D1FAE5', text: '#065F46' };
      case 'PARTIAL': return { bg: '#FEF3C7', text: '#92400E' };
      case 'PENDING': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'OVERDUE': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance Reports</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#e35336' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : activeTab === 'audit' ? (
          auditLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No audit logs found</Text>
            </View>
          ) : (
            auditLogs.map((log) => (
              <View key={log.id} style={styles.auditCard}>
                <View style={styles.auditHeader}>
                  <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
                  <View style={styles.auditInfo}>
                    <Text style={styles.auditAction}>{log.action}</Text>
                    <Text style={styles.auditBy}>by {log.performedBy}</Text>
                  </View>
                  <Text style={styles.auditDate}>{formatDate(log.performedAt)}</Text>
                </View>
                {log.details && <Text style={styles.auditDetails}>{log.details}</Text>}
              </View>
            ))
          )
        ) : (
          <>
            {summary && (
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { borderLeftColor: '#10B981' }]}>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.total)}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftColor: '#e35336' }]}>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.collected)}</Text>
                  <Text style={styles.summaryLabel}>Collected</Text>
                </View>
                <View style={[styles.summaryCard, { borderLeftColor: '#D97706' }]}>
                  <Text style={styles.summaryValue}>{formatCurrency(summary.pending)}</Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
              </View>
            )}

            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No {activeTab} entries found</Text>
              </View>
            ) : (
              entries.map((entry) => {
                const st = getStatusStyle(entry.status);
                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                      <View style={styles.entryInfo}>
                        {entry.studentName && <Text style={styles.studentName}>{entry.studentName}</Text>}
                        {entry.className && <Text style={styles.className}>{entry.className}</Text>}
                        <Text style={styles.entryDesc}>{entry.description}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.text }]}>{entry.status || 'N/A'}</Text>
                      </View>
                    </View>
                    <View style={styles.entryDetails}>
                      <View style={styles.entryDetail}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>{formatCurrency(entry.amount)}</Text>
                      </View>
                      <View style={styles.entryDetail}>
                        <Text style={styles.detailLabel}>Paid</Text>
                        <Text style={[styles.detailValue, { color: '#10B981' }]}>{formatCurrency(entry.paid)}</Text>
                      </View>
                      <View style={styles.entryDetail}>
                        <Text style={styles.detailLabel}>Balance</Text>
                        <Text style={[styles.detailValue, { color: entry.balance > 0 ? '#EF4444' : '#10B981' }]}>
                          {formatCurrency(entry.balance)}
                        </Text>
                      </View>
                    </View>
                    {(entry.date || entry.transactionRef) && (
                      <View style={styles.entryMeta}>
                        {entry.date && <Text style={styles.metaText}>{formatDate(entry.date)}</Text>}
                        {entry.transactionRef && <Text style={styles.metaText}>Ref: {entry.transactionRef}</Text>}
                      </View>
                    )}
                    {activeTab === 'overdue' && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleMarkOverdue(entry.id)}>
                        <Ionicons name="flag" size={14} color="#EF4444" />
                        <Text style={styles.actionBtnText}>Mark Overdue</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { backgroundColor: '#FFFFFF', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  activeTab: { backgroundColor: '#FEE2E2' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#e35336' },
  content: { padding: 16, gap: 12 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 3 },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  entryCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  entryInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  className: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  entryDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  entryDetails: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  entryDetail: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#9CA3AF' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 2 },
  entryMeta: { flexDirection: 'row', gap: 16 },
  metaText: { fontSize: 11, color: '#9CA3AF' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  actionBtnText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  auditCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  auditHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  auditInfo: { flex: 1 },
  auditAction: { fontSize: 14, fontWeight: '500', color: '#111827' },
  auditBy: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  auditDate: { fontSize: 11, color: '#9CA3AF' },
  auditDetails: { fontSize: 13, color: '#374151' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
});
