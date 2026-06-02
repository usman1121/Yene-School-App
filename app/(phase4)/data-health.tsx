import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface HealthIssue {
  id: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  count: number;
  category: string;
  affectedRecords: number;
}

interface HealthSummary {
  totalIssues: number;
  lowCount: number;
  mediumCount: number;
  highCount: number;
}

export default function DataHealthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [issues, setIssues] = useState<HealthIssue[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get('/data-quality/student-consistency');
      const data = res.data?.data || res.data || {};
      setIssues(Array.isArray(data.issues) ? data.issues : Array.isArray(data) ? data : []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data health report');
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

  const severityConfig = {
    LOW: { icon: 'information-circle', bg: '#D1FAE5', text: '#065F46', label: 'Low' },
    MEDIUM: { icon: 'warning', bg: '#FEF3C7', text: '#92400E', label: 'Medium' },
    HIGH: { icon: 'alert-circle', bg: '#FEE2E2', text: '#991B1B', label: 'High' },
  };

  const issuesBySeverity = (sev: string) => issues.filter(i => i.severity === sev);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Health</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Health</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Health</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {summary && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.totalIssues}</Text>
                <Text style={styles.summaryLabel}>Total Issues</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.summaryValue, { color: '#065F46' }]}>{summary.lowCount}</Text>
                <Text style={[styles.summaryLabel, { color: '#065F46' }]}>Low</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.summaryValue, { color: '#92400E' }]}>{summary.mediumCount}</Text>
                <Text style={[styles.summaryLabel, { color: '#92400E' }]}>Medium</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.summaryValue, { color: '#991B1B' }]}>{summary.highCount}</Text>
                <Text style={[styles.summaryLabel, { color: '#991B1B' }]}>High</Text>
              </View>
            </View>
          </View>
        )}

        {issues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>No data consistency issues found.</Text>
          </View>
        ) : (
          ['HIGH', 'MEDIUM', 'LOW'].map((sev) => {
            const sevIssues = issuesBySeverity(sev);
            if (sevIssues.length === 0) return null;
            const cfg = severityConfig[sev as keyof typeof severityConfig];
            return (
              <View key={sev} style={styles.severitySection}>
                <View style={[styles.severityHeader, { backgroundColor: cfg.bg }]}>
                  <Ionicons name={cfg.icon as any} size={18} color={cfg.text} />
                  <Text style={[styles.severityTitle, { color: cfg.text }]}>{cfg.label} Priority</Text>
                  <Text style={[styles.severityCount, { color: cfg.text }]}>{sevIssues.length}</Text>
                </View>
                {sevIssues.map((issue) => (
                  <View key={issue.id} style={styles.issueCard}>
                    <View style={styles.issueHeader}>
                      <Text style={styles.issueDesc} numberOfLines={2}>{issue.description}</Text>
                      <View style={[styles.severityBadge, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.severityBadgeText, { color: cfg.text }]}>{cfg.label}</Text>
                      </View>
                    </View>
                    {issue.category && <Text style={styles.issueCategory}>{issue.category}</Text>}
                    <View style={styles.issueMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="people" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{issue.affectedRecords} affected</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="document-text" size={14} color="#6B7280" />
                        <Text style={styles.metaText}>{issue.count} records</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
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
  content: { padding: 16, gap: 16 },
  summaryContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  summaryTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  summaryLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  severitySection: { gap: 8 },
  severityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  severityTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  severityCount: { fontSize: 14, fontWeight: '700' },
  issueCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  issueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  issueDesc: { fontSize: 14, color: '#111827', fontWeight: '500', flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  issueCategory: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  issueMeta: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#10B981' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  errorContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  errorText: { fontSize: 14, color: '#EF4444', textAlign: 'center', maxWidth: 280 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e35336', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
