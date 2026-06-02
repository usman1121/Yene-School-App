import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Linking } from 'react-native';
import api from '@/lib/api/core';
import { useAuth } from '@/contexts/AuthContext';

interface ClassOption {
  id: string;
  name: string;
}

interface PerformanceSummary {
  studentCount: number;
  passRate: number;
  averageScore: number;
  totalStudents: number;
  passed: number;
  failed: number;
}

export default function PerformanceBriefScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedClass) params.classId = selectedClass;

      const [summaryRes, classesRes] = await Promise.all([
        api.get('/report-cards/parent-presentation', { params }).catch(() => ({ data: null })),
        api.get('/classes').catch(() => ({ data: [] })),
      ]);

      const data = summaryRes.data?.data || summaryRes.data || {};
      setSummary(data.summary || data);
      const clsData = classesRes.data?.data || classesRes.data || [];
      setClasses(Array.isArray(clsData) ? clsData : []);
    } catch (err) {
      console.error('Failed to load performance brief:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleDownloadPDF = async () => {
    setDownloading('pdf');
    try {
      const params = selectedClass ? `?classId=${selectedClass}` : '';
      const res = await api.get(`/report-cards/parent-presentation/pdf${params}`, {
        responseType: 'blob',
      });
      const url = res.data?.url || res.request?.responseURL;
      if (url) await Linking.openURL(url);
      else Alert.alert('Download', 'PDF download started.');
    } catch (err: any) {
      const url = `/report-cards/parent-presentation/pdf${selectedClass ? `?classId=${selectedClass}` : ''}`;
      const fullUrl = `${api.defaults?.baseURL || ''}${url}`;
      await Linking.openURL(fullUrl).catch(() =>
        Alert.alert('Download', 'Opening PDF download in browser.')
      );
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloading('excel');
    try {
      const params = selectedClass ? `?classId=${selectedClass}` : '';
      const res = await api.get(`/report-cards/parent-presentation/excel${params}`, {
        responseType: 'blob',
      });
      const url = res.data?.url || res.request?.responseURL;
      if (url) await Linking.openURL(url);
      else Alert.alert('Download', 'Excel download started.');
    } catch {
      const url = `/report-cards/parent-presentation/excel${selectedClass ? `?classId=${selectedClass}` : ''}`;
      const fullUrl = `${api.defaults?.baseURL || ''}${url}`;
      await Linking.openURL(fullUrl).catch(() =>
        Alert.alert('Download', 'Opening Excel download in browser.')
      );
    } finally {
      setDownloading(null);
    }
  };

  const passRateColor = summary ? (summary.passRate >= 75 ? '#10B981' : summary.passRate >= 50 ? '#D97706' : '#EF4444') : '#6B7280';

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Performance Brief</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance Brief</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter by Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, !selectedClass && styles.filterChipActive]}
              onPress={() => setSelectedClass('')}
            >
              <Text style={[styles.filterChipText, !selectedClass && styles.filterChipTextActive]}>All Classes</Text>
            </TouchableOpacity>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[styles.filterChip, selectedClass === cls.id && styles.filterChipActive]}
                onPress={() => setSelectedClass(cls.id)}
              >
                <Text style={[styles.filterChipText, selectedClass === cls.id && styles.filterChipTextActive]}>{cls.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {summary && (
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="people" size={22} color="#e35336" />
              </View>
              <Text style={styles.statValue}>{summary.studentCount}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={22} color="#10B981" />
              </View>
              <Text style={styles.statValue}>{summary.passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="close-circle" size={22} color="#EF4444" />
              </View>
              <Text style={styles.statValue}>{summary.failed}</Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
          </View>
        )}

        {summary && (
          <View style={styles.rateCard}>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Pass Rate</Text>
              <Text style={[styles.rateValue, { color: passRateColor }]}>{summary.passRate?.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(summary.passRate, 100)}%`, backgroundColor: passRateColor }]} />
            </View>
            <View style={styles.rateRow}>
              <Text style={styles.rateLabel}>Average Score</Text>
              <Text style={styles.rateValue}>{summary.averageScore?.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(summary.averageScore, 100)}%`, backgroundColor: '#e35336' }]} />
            </View>
          </View>
        )}

        <View style={styles.downloadSection}>
          <Text style={styles.sectionTitle}>Download Reports</Text>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadPDF}
            disabled={downloading === 'pdf'}
          >
            {downloading === 'pdf' ? (
              <ActivityIndicator size="small" color="#e35336" />
            ) : (
              <Ionicons name="document-text" size={22} color="#e35336" />
            )}
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadLabel}>Download PDF</Text>
              <Text style={styles.downloadDesc}>Parent presentation report in PDF format</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownloadExcel}
            disabled={downloading === 'excel'}
          >
            {downloading === 'excel' ? (
              <ActivityIndicator size="small" color="#059669" />
            ) : (
              <Ionicons name="grid" size={22} color="#059669" />
            )}
            <View style={styles.downloadInfo}>
              <Text style={styles.downloadLabel}>Download Excel</Text>
              <Text style={styles.downloadDesc}>Raw data in spreadsheet format</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

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
  filterSection: { marginBottom: 4 },
  filterLabel: { fontSize: 13, color: '#6B7280', marginBottom: 8, fontWeight: '500' },
  filterScroll: { flexDirection: 'row' },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  filterChipText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  filterChipTextActive: { color: '#e35336' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  rateCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rateLabel: { fontSize: 14, color: '#374151' },
  rateValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
  progressBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  downloadSection: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  downloadInfo: { flex: 1 },
  downloadLabel: { fontSize: 14, fontWeight: '500', color: '#111827' },
  downloadDesc: { fontSize: 12, color: '#6B7280', marginTop: 1 },
});
