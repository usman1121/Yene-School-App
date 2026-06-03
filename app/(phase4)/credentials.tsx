import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

interface Credential {
  id: string;
  username: string;
  role: string;
  status: 'SENT' | 'PENDING';
  generatedAt: string;
  studentName?: string;
  schoolId?: string;
}

interface CredentialStats {
  total: number;
  sent: number;
  pending: number;
  byRole: Record<string, number>;
}

const ROLES = ['STUDENT', 'TEACHER', 'PARENT', 'STAFF', 'ADMIN'];

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any => {
  return res?.data?.data ?? res?.data ?? res ?? null;
};

export default function CredentialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<CredentialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bulkModal, setBulkModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [bulkForm, setBulkForm] = useState({ role: 'STUDENT', schoolId: '', count: 10, password: '' });
  const [generating, setGenerating] = useState(false);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [usernameCheck, setUsernameCheck] = useState<string>('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      const [credRes, statsRes] = await Promise.all([
        api.get('/credentials', { params }),
        api.get('/credentials/stats'),
      ]);
      setCredentials(extractList(credRes) as Credential[]);
      setStats(extractData(statsRes) as CredentialStats | null);
    } catch (error) {
      console.error('Failed to fetch credentials:', error);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const markAsSent = async (id: string) => {
    try {
      await api.post(`/credentials/${id}/send`);
      Alert.alert('Success', 'Marked as sent');
      fetchData();
    } catch { Alert.alert('Error', 'Failed to mark as sent'); }
  };

  const deleteCred = (id: string) => {
    Alert.alert('Delete', 'Delete this credential?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/credentials/${id}`);
          Alert.alert('Success', 'Credential deleted');
          fetchData();
        } catch { Alert.alert('Error', 'Failed to delete credential'); }
      }},
    ]);
  };

  const generateBulk = async () => {
    if (!bulkForm.schoolId || !bulkForm.password) {
      Alert.alert('Validation', 'School ID and password are required');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/credentials/generate/bulk', bulkForm);
      setBulkModal(false);
      setBulkForm({ role: 'STUDENT', schoolId: '', count: 10, password: '' });
      Alert.alert('Success', 'Credentials generated');
      fetchData();
    } catch {
      Alert.alert('Error', 'Failed to generate credentials');
    } finally {
      setGenerating(false);
    }
  };

  const previewNextIds = async () => {
    try {
      const res = await api.get(`/credentials/preview/student/${bulkForm.schoolId}`);
      const data = extractData(res);
      setPreviewData(Array.isArray(data) ? data : [data]);
      setPreviewModal(true);
    } catch {
      Alert.alert('Error', 'Failed to preview IDs');
    }
  };

  const previewStaffIds = async () => {
    try {
      const res = await api.get(`/credentials/preview/staff/${bulkForm.schoolId}`);
      const data = extractData(res);
      setPreviewData(Array.isArray(data) ? data : [data]);
      setPreviewModal(true);
    } catch {
      Alert.alert('Error', 'Failed to preview staff IDs');
    }
  };

  const validatePassword = async () => {
    try {
      const res = await api.post('/credentials/validate-password', { password: bulkForm.password });
      const data = extractData(res);
      setPasswordValid(data?.valid === true);
    } catch {
      setPasswordValid(false);
    }
  };

  const checkUsername = async () => {
    if (!usernameCheck) return;
    try {
      await api.get(`/credentials/check-username/${usernameCheck}`);
      setUsernameAvailable(true);
    } catch {
      setUsernameAvailable(false);
    }
  };

  const exportCsv = async () => {
    try {
      await api.post('/credentials/export/csv');
      Alert.alert('Success', 'CSV export initiated');
    } catch {
      Alert.alert('Error', 'Failed to export CSV');
    }
  };

  const formatDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credentials</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={exportCsv} style={styles.headerIconBtn}>
            <Ionicons name="download-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setBulkModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.sent}</Text>
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      )}

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          <TouchableOpacity style={[styles.filterChip, !roleFilter && !statusFilter && styles.filterChipActive]} onPress={() => { setRoleFilter(''); setStatusFilter(''); }}>
            <Text style={[styles.filterChipText, !roleFilter && !statusFilter && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          {ROLES.map((r) => (
            <TouchableOpacity key={r} style={[styles.filterChip, roleFilter === r && styles.filterChipActive]} onPress={() => setRoleFilter(roleFilter === r ? '' : r)}>
              <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.filterChip, statusFilter === 'PENDING' && styles.filterChipActive]} onPress={() => setStatusFilter(statusFilter === 'PENDING' ? '' : 'PENDING')}>
            <Text style={[styles.filterChipText, statusFilter === 'PENDING' && styles.filterChipTextActive]}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterChip, statusFilter === 'SENT' && styles.filterChipActive]} onPress={() => setStatusFilter(statusFilter === 'SENT' ? '' : 'SENT')}>
            <Text style={[styles.filterChipText, statusFilter === 'SENT' && styles.filterChipTextActive]}>Sent</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : credentials.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="key-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No credentials found</Text>
          </View>
        ) : (
          credentials.map((cred) => (
            <View key={cred.id} style={styles.credCard}>
              <View style={styles.credHeader}>
                <View style={styles.credAvatar}>
                  <Ionicons name={cred.role === 'STUDENT' ? 'person' : cred.role === 'TEACHER' ? 'school' : 'people'} size={20} color="#e35336" />
                </View>
                <View style={styles.credInfo}>
                  <Text style={styles.credUsername}>{cred.username}</Text>
                  <Text style={styles.credRole}>{cred.role}</Text>
                </View>
                <View style={[styles.credStatus, { backgroundColor: cred.status === 'SENT' ? '#D1FAE5' : '#FEF3C7' }]}>
                  <Text style={[styles.credStatusText, { color: cred.status === 'SENT' ? '#065F46' : '#92400E' }]}>{cred.status}</Text>
                </View>
              </View>
              {cred.studentName && <Text style={styles.credName}>{cred.studentName}</Text>}
              <View style={styles.credMeta}>
                <Text style={styles.credDate}>{formatDate(cred.generatedAt)}</Text>
                <View style={styles.credActions}>
                  {cred.status === 'PENDING' && (
                    <TouchableOpacity style={styles.sendBtn} onPress={() => markAsSent(cred.id)}>
                      <Ionicons name="send-outline" size={14} color="#e35336" />
                      <Text style={styles.sendBtnText}>Send</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => deleteCred(cred.id)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={bulkModal} animationType="slide" transparent onRequestClose={() => setBulkModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Generate Bulk Credentials</Text>

              <Text style={styles.modalLabel}>Role</Text>
              <View style={styles.pickerRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity key={r} style={[styles.pickerOption, bulkForm.role === r && styles.pickerOptionActive]} onPress={() => setBulkForm({ ...bulkForm, role: r })}>
                    <Text style={[styles.pickerOptionText, bulkForm.role === r && styles.pickerOptionTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.input} placeholder="School ID" value={bulkForm.schoolId} onChangeText={(v) => setBulkForm({ ...bulkForm, schoolId: v })} placeholderTextColor="#9CA3AF" />
              <TextInput style={styles.input} placeholder="Number of credentials" value={String(bulkForm.count)} onChangeText={(v) => setBulkForm({ ...bulkForm, count: parseInt(v) || 10 })} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
              <TextInput style={styles.input} placeholder="Password" value={bulkForm.password} onChangeText={(v) => { setBulkForm({ ...bulkForm, password: v }); setPasswordValid(null); }} secureTextEntry placeholderTextColor="#9CA3AF" />

              <TouchableOpacity style={styles.validateBtn} onPress={validatePassword}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#e35336" />
                <Text style={styles.validateBtnText}>Validate Password</Text>
              </TouchableOpacity>
              {passwordValid === true && <Text style={styles.validText}>Password is valid</Text>}
              {passwordValid === false && <Text style={styles.invalidText}>Password is not valid</Text>}

              <View style={styles.previewRow}>
                <TouchableOpacity style={styles.previewBtn} onPress={previewNextIds}>
                  <Ionicons name="eye-outline" size={16} color="#e35336" />
                  <Text style={styles.previewBtnText}>Preview Student IDs</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewBtn} onPress={previewStaffIds}>
                  <Ionicons name="eye-outline" size={16} color="#e35336" />
                  <Text style={styles.previewBtnText}>Preview Staff IDs</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.usernameCheckRow}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Check username" value={usernameCheck} onChangeText={(v) => { setUsernameCheck(v); setUsernameAvailable(null); }} placeholderTextColor="#9CA3AF" />
                <TouchableOpacity style={styles.checkBtn} onPress={checkUsername}>
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              {usernameAvailable === true && <Text style={styles.validText}>Username available</Text>}
              {usernameAvailable === false && <Text style={styles.invalidText}>Username taken</Text>}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setBulkModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, generating && { opacity: 0.6 }]} onPress={generateBulk} disabled={generating}>
                  {generating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Generate</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={previewModal} animationType="slide" transparent onRequestClose={() => setPreviewModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>Preview IDs</Text>
              <TouchableOpacity onPress={() => setPreviewModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {previewData.length === 0 ? (
              <Text style={styles.noPreview}>No IDs to preview</Text>
            ) : (
              previewData.map((item, idx) => (
                <View key={idx} style={styles.previewItem}>
                  <Text style={styles.previewItemText}>{item.username || item.id || item}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconBtn: { padding: 4 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e35336' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16, gap: 12 },
  credCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  credHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  credAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  credInfo: { flex: 1 },
  credUsername: { fontSize: 15, fontWeight: '600', color: '#111827' },
  credRole: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  credStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  credStatusText: { fontSize: 10, fontWeight: '700' },
  credName: { fontSize: 13, color: '#374151' },
  credMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  credDate: { fontSize: 12, color: '#9CA3AF' },
  credActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sendBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#e35336' },
  sendBtnText: { fontSize: 12, fontWeight: '600', color: '#e35336' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  validateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  validateBtnText: { fontSize: 13, fontWeight: '600', color: '#e35336' },
  validText: { fontSize: 12, color: '#10B981', marginBottom: 8 },
  invalidText: { fontSize: 12, color: '#EF4444', marginBottom: 8 },
  previewRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  previewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e35336' },
  previewBtnText: { fontSize: 11, fontWeight: '600', color: '#e35336' },
  usernameCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  checkBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noPreview: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 20 },
  previewItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  previewItemText: { fontSize: 14, color: '#374151' },
});
