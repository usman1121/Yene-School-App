import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any | null => {
  const d = res?.data?.data || res?.data || res || null;
  return d;
};

interface DashboardData {
  totalSessions: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number;
  teachersWithMissing: number;
  missingRecords: number;
}

interface Session {
  id: string;
  date: string;
  className: string;
  subjectName: string;
  teacherName: string;
  totalStudents: number;
  recorded: number;
  status: string;
}

interface SummaryItem {
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  rate: number;
}

interface MissingRecord {
  id: string;
  className: string;
  subjectName: string;
  teacherName: string;
  teacherId: string;
  date: string;
  studentsCount: number;
}

type TabType = 'overview' | 'sessions' | 'missing' | 'override';

export default function AttendanceAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabType>('overview');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [missing, setMissing] = useState<MissingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideId, setOverrideId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('PRESENT');
  const [overrideReason, setOverrideReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const params: any = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const [dashRes, sessRes, summRes, missRes] = await Promise.all([
        api.get('/attendance/dashboard/admin', { params }),
        api.get('/attendance/sessions', { params }),
        api.get('/attendance/summary', { params }),
        api.get('/attendance/missing', { params }),
      ]);

      setDashboard(extractData(dashRes) as DashboardData | null);
      setSessions(extractList(sessRes) as Session[]);
      setSummary(extractList(summRes) as SummaryItem[]);
      setMissing(extractList(missRes) as MissingRecord[]);
    } catch (error: any) {
      console.error('Failed to load attendance data:', error);
      setError(error?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const notifyTeachers = async () => {
    setActionLoading(true);
    try {
      await api.post('/attendance/missing/notify', {});
      Alert.alert('Success', 'Notifications sent to teachers with missing records.');
    } catch {
      Alert.alert('Error', 'Failed to send notifications.');
    } finally {
      setActionLoading(false);
    }
  };

  const openOverride = (id: string) => {
    setOverrideId(id);
    setOverrideStatus('PRESENT');
    setOverrideReason('');
    setOverrideModal(true);
  };

  const handleOverride = async () => {
    if (!overrideReason.trim()) {
      Alert.alert('Error', 'Reason is required for override.');
      return;
    }
    setActionLoading(true);
    try {
      await api.put(`/attendance/record/${overrideId}`, { status: overrideStatus, reason: overrideReason.trim() });
      setOverrideModal(false);
      Alert.alert('Success', 'Attendance record overridden.');
      await fetchAll();
    } catch {
      Alert.alert('Error', 'Failed to override record.');
    } finally {
      setActionLoading(false);
    }
  };

  const applyDateFilter = () => {
    setShowDateFilter(false);
    setLoading(true);
    fetchAll();
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
    setShowDateFilter(false);
    setLoading(true);
  };

  const formatDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  const renderOverview = () => (
    <>
      {dashboard && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}><Text style={styles.statNumber}>{dashboard.totalSessions}</Text><Text style={styles.statLabel}>Sessions</Text></View>
            <View style={styles.statCard}><Text style={[styles.statNumber, { color: '#10B981' }]}>{dashboard.attendanceRate}%</Text><Text style={styles.statLabel}>Rate</Text></View>
            <View style={styles.statCard}><Text style={[styles.statNumber, { color: '#EF4444' }]}>{dashboard.teachersWithMissing}</Text><Text style={styles.statLabel}>Teachers Missing</Text></View>
            <View style={styles.statCard}><Text style={[styles.statNumber, { color: '#F59E0B' }]}>{dashboard.missingRecords}</Text><Text style={styles.statLabel}>Missing Records</Text></View>
          </View>

          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Attendance Breakdown</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.breakdownLabel}>Present</Text>
                <Text style={styles.breakdownValue}>{dashboard.presentCount}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.dot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.breakdownLabel}>Absent</Text>
                <Text style={styles.breakdownValue}>{dashboard.absentCount}</Text>
              </View>
              <View style={styles.breakdownItem}>
                <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.breakdownLabel}>Late</Text>
                <Text style={styles.breakdownValue}>{dashboard.lateCount}</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {summary.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Summary by Class</Text>
          {summary.map((item, i) => (
            <View key={i} style={styles.summaryRow}>
              <Text style={styles.summaryClassName}>{item.className}</Text>
              <View style={styles.summaryBar}>
                <View style={[styles.summaryBarFill, { width: `${item.rate}%`, backgroundColor: item.rate >= 90 ? '#10B981' : item.rate >= 70 ? '#F59E0B' : '#EF4444' }]} />
              </View>
              <Text style={styles.summaryRate}>{item.rate}%</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderSessions = () => (
    <>
      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No sessions found</Text>
        </View>
      ) : (
        sessions.map((s, i) => (
          <View key={s.id || i} style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <Text style={styles.sessionSubject}>{s.subjectName}</Text>
              <View style={[styles.sessionStatus, { backgroundColor: s.status === 'COMPLETED' ? '#D1FAE5' : '#FEF3C7' }]}>
                <Text style={[styles.sessionStatusText, { color: s.status === 'COMPLETED' ? '#065F46' : '#92400E' }]}>{s.status}</Text>
              </View>
            </View>
            <Text style={styles.sessionClass}>{s.className}</Text>
            <Text style={styles.sessionTeacher}>{s.teacherName}</Text>
            <View style={styles.sessionMeta}>
              <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
              <Text style={styles.sessionCount}>{s.recorded} / {s.totalStudents} recorded</Text>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderMissing = () => (
    <>
      {missing.length > 0 && (
        <TouchableOpacity style={styles.notifyAllBtn} onPress={notifyTeachers} disabled={actionLoading}>
          {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.notifyAllText}>Notify All Teachers</Text>}
        </TouchableOpacity>
      )}
      {missing.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No missing attendance records</Text>
        </View>
      ) : (
        missing.map((m, i) => (
          <View key={m.id || i} style={styles.missingCard}>
            <View style={styles.missingTop}>
              <View style={styles.missingInfo}>
                <Text style={styles.missingTeacher}>{m.teacherName}</Text>
                <Text style={styles.missingClass}>{m.className} - {m.subjectName}</Text>
                <Text style={styles.missingDate}>{formatDate(m.date)}</Text>
              </View>
              <View style={styles.missingRight}>
                <Text style={styles.missingCount}>{m.studentsCount} students</Text>
                <TouchableOpacity style={styles.overrideBtn} onPress={() => openOverride(m.id)}>
                  <Text style={styles.overrideBtnText}>Override</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </>
  );

  const renderOverride = () => (
    <View style={styles.overrideContainer}>
      <Text style={styles.overrideHint}>Enter a record ID manually or select one from the Missing tab.</Text>
      <TextInput
        style={styles.input}
        placeholder="Record ID"
        placeholderTextColor="#9CA3AF"
        value={overrideId}
        onChangeText={setOverrideId}
      />
      <Text style={styles.fieldLabel}>New Status</Text>
      <View style={styles.pickerRow}>
        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.pickerOption, overrideStatus === s && styles.pickerOptionActive]}
            onPress={() => setOverrideStatus(s)}
          >
            <Text style={[styles.pickerOptionText, overrideStatus === s && styles.pickerOptionTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Reason for override"
        placeholderTextColor="#9CA3AF"
        value={overrideReason}
        onChangeText={setOverrideReason}
        multiline
      />
      <TouchableOpacity style={[styles.saveBtn, actionLoading && { opacity: 0.6 }]} onPress={handleOverride} disabled={actionLoading}>
        {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Override Record</Text>}
      </TouchableOpacity>
    </View>
  );

  const hasDateFilter = fromDate || toDate;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance (Admin)</Text>
        <TouchableOpacity onPress={() => setShowDateFilter(true)} style={styles.filterBtn}>
          <Ionicons name="funnel" size={20} color={hasDateFilter ? '#e35336' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {hasDateFilter && (
        <View style={styles.activeFilterBar}>
          <Ionicons name="calendar" size={14} color="#e35336" />
          <Text style={styles.activeFilterText}>
            {fromDate || 'Any'} to {toDate || 'Any'}
          </Text>
          <TouchableOpacity onPress={clearDateFilter}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.tabRow}>
        {(['overview', 'sessions', 'missing', 'override'] as TabType[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.activeTab]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.activeTabText, { textTransform: 'capitalize' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchAll(); }}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {tab === 'overview' && renderOverview()}
            {tab === 'sessions' && renderSessions()}
            {tab === 'missing' && renderMissing()}
            {tab === 'override' && renderOverride()}
          </>
        )}
      </ScrollView>

      <Modal visible={showDateFilter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Date Filter</Text>
              <TouchableOpacity onPress={() => setShowDateFilter(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>From Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-01-01"
              placeholderTextColor="#9CA3AF"
              value={fromDate}
              onChangeText={setFromDate}
              autoCapitalize="none"
            />
            <Text style={styles.fieldLabel}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2025-12-31"
              placeholderTextColor="#9CA3AF"
              value={toDate}
              onChangeText={setToDate}
              autoCapitalize="none"
            />
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearDateFilter}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyDateFilter}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={overrideModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Override Attendance</Text>
              <TouchableOpacity onPress={() => setOverrideModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Record ID: {overrideId}</Text>
            <Text style={styles.fieldLabel}>New Status</Text>
            <View style={styles.pickerRow}>
              {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pickerOption, overrideStatus === s && styles.pickerOptionActive]}
                  onPress={() => setOverrideStatus(s)}
                >
                  <Text style={[styles.pickerOptionText, overrideStatus === s && styles.pickerOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Reason for override"
              placeholderTextColor="#9CA3AF"
              value={overrideReason}
              onChangeText={setOverrideReason}
              multiline
            />
            <TouchableOpacity style={[styles.saveBtn, actionLoading && { opacity: 0.6 }]} onPress={handleOverride} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Override</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterBtn: { padding: 4 },
  activeFilterBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FEF2F2', borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  activeFilterText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#991B1B' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#e35336' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 4 },
  statNumber: { fontSize: 22, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  breakdownCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  breakdownTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-around' },
  breakdownItem: { alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { fontSize: 12, color: '#6B7280' },
  breakdownValue: { fontSize: 18, fontWeight: '700', color: '#111827' },
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  summaryClassName: { width: 80, fontSize: 12, fontWeight: '500', color: '#374151' },
  summaryBar: { flex: 1, height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  summaryBarFill: { height: '100%', borderRadius: 4 },
  summaryRate: { width: 40, fontSize: 12, fontWeight: '700', color: '#374151', textAlign: 'right' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  retryBtn: { marginTop: 12, backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  sessionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sessionSubject: { fontSize: 15, fontWeight: '600', color: '#111827' },
  sessionStatus: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  sessionStatusText: { fontSize: 10, fontWeight: '700' },
  sessionClass: { fontSize: 13, color: '#6B7280' },
  sessionTeacher: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  sessionMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionDate: { fontSize: 11, color: '#9CA3AF' },
  sessionCount: { fontSize: 11, color: '#9CA3AF' },
  notifyAllBtn: { backgroundColor: '#e35336', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 8 },
  notifyAllText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  missingCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 8 },
  missingTop: { flexDirection: 'row', justifyContent: 'space-between' },
  missingInfo: { flex: 1, gap: 2 },
  missingTeacher: { fontSize: 14, fontWeight: '600', color: '#111827' },
  missingClass: { fontSize: 12, color: '#6B7280' },
  missingDate: { fontSize: 11, color: '#9CA3AF' },
  missingRight: { alignItems: 'flex-end', gap: 6 },
  missingCount: { fontSize: 12, fontWeight: '600', color: '#EF4444' },
  overrideBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e35336' },
  overrideBtnText: { fontSize: 11, fontWeight: '600', color: '#e35336' },
  overrideContainer: { padding: 4 },
  overrideHint: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  saveBtn: { backgroundColor: '#e35336', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  clearBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  applyBtn: { flex: 1, backgroundColor: '#e35336', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  applyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
});
