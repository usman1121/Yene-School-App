import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAITLISTED' | 'ALL';

interface EnrollmentRequest {
  id: string;
  studentName: string;
  grade: string;
  status: RequestStatus;
  createdAt: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  previousSchool?: string;
}

interface EnrollmentStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  waitlisted: number;
}

interface ClassSection {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
}

const STATUS_TABS: { key: RequestStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'WAITLISTED', label: 'Waitlisted' },
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', icon: 'time' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', icon: 'checkmark-circle' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', icon: 'close-circle' },
  WAITLISTED: { bg: '#DBEAFE', text: '#1E40AF', icon: 'hourglass' },
};

export default function StudentAdmissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<EnrollmentRequest[]>([]);
  const [stats, setStats] = useState<EnrollmentStats | null>(null);
  const [filter, setFilter] = useState<RequestStatus>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publicInfo, setPublicInfo] = useState<{ open: boolean; availableGrades: string[] } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EnrollmentRequest | null>(null);
  const [classSections, setClassSections] = useState<ClassSection[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (filter !== 'ALL') params.status = filter;

      const [reqRes, statsRes, publicRes] = await Promise.all([
        api.get('/enrollment/requests', { params }).catch(() => ({ data: [] })),
        api.get('/enrollment/stats').catch(() => ({ data: null })),
        api.get('/enrollment/public-info').catch(() => ({ data: null })),
      ]);

      const reqData = reqRes.data?.data || reqRes.data || [];
      setRequests(Array.isArray(reqData) ? reqData : []);
      setStats(statsRes.data?.data || statsRes.data);
      setPublicInfo(publicRes.data?.data || publicRes.data);
    } catch (err) {
      console.error('Failed to load enrollment data:', err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const fetchClassSections = async () => {
    try {
      const res = await api.get('/classes/sections');
      const data = res.data?.data || res.data || [];
      setClassSections(Array.isArray(data) ? data : []);
    } catch {
      setClassSections([]);
    }
  };

  const openActionModal = (req: EnrollmentRequest) => {
    setSelectedRequest(req);
    fetchClassSections();
    setSelectedClassId('');
    setSelectedSectionId('');
    setRollNumber('');
    setModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !selectedClassId || !selectedSectionId) {
      Alert.alert('Required', 'Please select class and section.');
      return;
    }
    setProcessing(true);
    try {
      await api.post(`/enrollment/requests/${selectedRequest.id}/approve`, {
        classId: selectedClassId,
        sectionId: selectedSectionId,
        rollNumber: rollNumber || undefined,
      });
      Alert.alert('Approved', `${selectedRequest.studentName} has been approved.`);
      setModalVisible(false);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to approve.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (req: EnrollmentRequest) => {
    Alert.prompt
      ? Alert.prompt('Reject Request', `Why are you rejecting ${req.studentName}?`, async (reason) => {
          if (!reason) return;
          try {
            await api.post(`/enrollment/requests/${req.id}/reject`, { reason });
            Alert.alert('Rejected', 'Request has been rejected.');
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to reject.');
          }
        })
      : Alert.alert('Reject', 'Enter reason:');
  };

  const handleWaitlist = async (req: EnrollmentRequest) => {
    try {
      await api.post(`/enrollment/requests/${req.id}/waitlist`);
      Alert.alert('Waitlisted', `${req.studentName} has been waitlisted.`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to waitlist.');
    }
  };

  const handleSendCredentials = async (req: EnrollmentRequest) => {
    try {
      await api.post(`/enrollment/requests/${req.id}/send-credentials`);
      Alert.alert('Sent', `Credentials sent to ${req.studentName}.`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send credentials.');
    }
  };

  const formatDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Admission</Text>
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
        <Text style={styles.headerTitle}>Student Admission</Text>
        <View style={styles.backBtn} />
      </View>

      {publicInfo && (
        <View style={[styles.publicInfo, publicInfo.open ? styles.publicOpen : styles.publicClosed]}>
          <Ionicons name={publicInfo.open ? 'checkmark-circle' : 'close-circle'} size={16} color={publicInfo.open ? '#065F46' : '#991B1B'} />
          <Text style={[styles.publicText, { color: publicInfo.open ? '#065F46' : '#991B1B' }]}>
            Enrollment is {publicInfo.open ? 'OPEN' : 'CLOSED'}
          </Text>
        </View>
      )}

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statNum}>{stats.pending}</Text><Text style={styles.statLabel}>Pending</Text></View>
          <View style={styles.statItem}><Text style={[styles.statNum, { color: '#065F46' }]}>{stats.approved}</Text><Text style={styles.statLabel}>Approved</Text></View>
          <View style={styles.statItem}><Text style={[styles.statNum, { color: '#991B1B' }]}>{stats.rejected}</Text><Text style={styles.statLabel}>Rejected</Text></View>
          <View style={styles.statItem}><Text style={[styles.statNum, { color: '#1E40AF' }]}>{stats.waitlisted}</Text><Text style={styles.statLabel}>Waitlisted</Text></View>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabContent}
      >
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, filter === tab.key && styles.activeTab]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.tabText, filter === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-add-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {filter === 'ALL' ? '' : filter.toLowerCase()} requests</Text>
          </View>
        ) : (
          requests.map((req) => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.PENDING;
            return (
              <View key={req.id} style={styles.reqCard}>
                <View style={styles.reqHeader}>
                  <View style={styles.reqAvatar}>
                    <Ionicons name="person" size={22} color="#e35336" />
                  </View>
                  <View style={styles.reqInfo}>
                    <Text style={styles.reqName}>{req.studentName}</Text>
                    <Text style={styles.reqGrade}>Grade: {req.grade}</Text>
                  </View>
                  <View style={[styles.reqStatus, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={12} color={cfg.text} />
                    <Text style={[styles.reqStatusText, { color: cfg.text }]}>{req.status}</Text>
                  </View>
                </View>
                <View style={styles.reqMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.metaText}>{formatDate(req.createdAt)}</Text>
                  </View>
                  {req.parentName && (
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={13} color="#9CA3AF" />
                      <Text style={styles.metaText}>{req.parentName}</Text>
                    </View>
                  )}
                </View>
                {req.status === 'PENDING' && (
                  <View style={styles.reqActions}>
                    <TouchableOpacity style={styles.actionApprove} onPress={() => openActionModal(req)}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.actionApproveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionWaitlist} onPress={() => handleWaitlist(req)}>
                      <Text style={styles.actionWaitlistText}>Waitlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionReject} onPress={() => handleReject(req)}>
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
                {req.status === 'APPROVED' && (
                  <TouchableOpacity style={styles.sendCredBtn} onPress={() => handleSendCredentials(req)}>
                    <Ionicons name="send" size={14} color="#e35336" />
                    <Text style={styles.sendCredText}>Send Credentials</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve Enrollment</Text>
            {selectedRequest && <Text style={styles.modalSubtitle}>{selectedRequest.studentName}</Text>}

            <Text style={styles.inputLabel}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
              {classSections.map((cs) => (
                <TouchableOpacity
                  key={cs.classId}
                  style={[styles.pickerChip, selectedClassId === cs.classId && styles.pickerChipActive]}
                  onPress={() => { setSelectedClassId(cs.classId); setSelectedSectionId(''); }}
                >
                  <Text style={[styles.pickerChipText, selectedClassId === cs.classId && styles.pickerChipTextActive]}>{cs.className}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedClassId ? (
              <>
                <Text style={styles.inputLabel}>Section</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {classSections.filter(cs => cs.classId === selectedClassId).map((cs) => (
                    <TouchableOpacity
                      key={cs.sectionId}
                      style={[styles.pickerChip, selectedSectionId === cs.sectionId && styles.pickerChipActive]}
                      onPress={() => setSelectedSectionId(cs.sectionId)}
                    >
                      <Text style={[styles.pickerChipText, selectedSectionId === cs.sectionId && styles.pickerChipTextActive]}>{cs.sectionName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text style={styles.inputLabel}>Roll Number (optional)</Text>
            <TextInput
              style={styles.input}
              value={rollNumber}
              onChangeText={setRollNumber}
              placeholder="e.g. 001"
              keyboardType="number-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, (!selectedClassId || !selectedSectionId) && styles.modalConfirmDisabled]}
                onPress={handleApprove}
                disabled={processing || !selectedClassId || !selectedSectionId}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  publicInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8 },
  publicOpen: { backgroundColor: '#D1FAE5' },
  publicClosed: { backgroundColor: '#FEE2E2' },
  publicText: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '700', color: '#e35336' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  tabScroll: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#FEE2E2' },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  activeTabText: { color: '#e35336' },
  content: { padding: 16, gap: 10 },
  reqCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  reqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  reqGrade: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  reqStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  reqStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  reqMeta: { flexDirection: 'row', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280' },
  reqActions: { flexDirection: 'row', gap: 8 },
  actionApprove: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#10B981', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  actionApproveText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  actionWaitlist: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  actionWaitlistText: { color: '#6B7280', fontWeight: '500', fontSize: 13 },
  actionReject: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FEE2E2' },
  sendCredBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  sendCredText: { fontSize: 13, color: '#e35336', fontWeight: '500' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 16 },
  inputLabel: { fontSize: 13, color: '#374151', fontWeight: '500', marginBottom: 8, marginTop: 12 },
  pickerScroll: { marginBottom: 8 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8 },
  pickerChipActive: { borderColor: '#e35336', backgroundColor: '#FEE2E2' },
  pickerChipText: { fontSize: 13, color: '#6B7280' },
  pickerChipTextActive: { color: '#e35336', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  modalCancelText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#10B981', alignItems: 'center' },
  modalConfirmDisabled: { opacity: 0.5 },
  modalConfirmText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
});
