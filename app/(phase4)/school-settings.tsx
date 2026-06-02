import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api/client';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any | null => {
  const d = res?.data?.data || res?.data || res || null;
  return d;
};

interface SchoolSetting {
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

interface SchoolInfo {
  id: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
}

export default function SchoolSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAllowed = user && ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(user.role);

  const schoolId = user?.schoolId || '';
  const [settings, setSettings] = useState<SchoolSetting[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'settings' | 'info'>('settings');
  const [editSetting, setEditSetting] = useState<SchoolSetting | null>(null);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [settingValue, setSettingValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [editInfo, setEditInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: '', address: '', phone: '', email: '', website: '' });

  const [batchInput, setBatchInput] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!schoolId) return;
    const res = await api.get(`/schools/${schoolId}/settings`);
    setSettings(extractList(res) as SchoolSetting[]);
  }, [schoolId]);

  const fetchSchoolInfo = useCallback(async () => {
    if (!schoolId) return;
    const res = await api.get(`/schools/${schoolId}`);
    const data = extractData(res) as SchoolInfo | null;
    setSchoolInfo(data);
    if (data) {
      setInfoForm({ name: data.name || '', address: data.address || '', phone: data.phone || '', email: data.email || '', website: data.website || '' });
    }
  }, [schoolId]);

  const loadAll = useCallback(async () => {
    if (!schoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchSettings(), fetchSchoolInfo()]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [fetchSettings, fetchSchoolInfo, schoolId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([fetchSettings(), fetchSchoolInfo()]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const openEditSetting = (s: SchoolSetting) => {
    setEditSetting(s);
    setSettingValue(s.value);
    setShowSettingModal(true);
  };

  const saveSetting = async () => {
    if (!editSetting) return;
    setActionLoading(true);
    try {
      await api.put(`/schools/${schoolId}/settings/${editSetting.key}`, { value: settingValue });
      Alert.alert('Success', 'Setting updated.');
      setShowSettingModal(false);
      await fetchSettings();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update setting.');
    } finally { setActionLoading(false); }
  };

  const deleteSetting = async (key: string) => {
    Alert.alert('Delete Setting', `Delete "${key}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/schools/${schoolId}/settings/${key}`);
          Alert.alert('Success', 'Setting deleted.');
          await fetchSettings();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Delete failed.'); }
      }},
    ]);
  };

  const saveSchoolInfo = async () => {
    if (!infoForm.name.trim()) { Alert.alert('Error', 'School name is required.'); return; }
    setActionLoading(true);
    try {
      await api.put(`/schools/${schoolId}`, infoForm);
      Alert.alert('Success', 'School info updated.');
      setEditInfo(false);
      await fetchSchoolInfo();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to update school.');
    } finally { setActionLoading(false); }
  };

  const handleBatchUpdate = async () => {
    if (!batchInput.trim()) { Alert.alert('Error', 'Enter settings JSON.'); return; }
    setActionLoading(true);
    try {
      const parsed = JSON.parse(batchInput);
      await api.put(`/schools/${schoolId}/settings/batch`, { settings: parsed });
      Alert.alert('Success', 'Settings batch updated.');
      setShowBatchModal(false);
      setBatchInput('');
      await fetchSettings();
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        Alert.alert('Error', 'Invalid JSON format.');
      } else {
        Alert.alert('Error', e?.response?.data?.message || 'Batch update failed.');
      }
    } finally { setActionLoading(false); }
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return d; }
  };

  if (!isAllowed) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>School Settings</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Access Denied</Text>
          <Text style={styles.emptyText}>You do not have permission to view this page.</Text>
        </View>
      </View>
    );
  }

  if (!schoolId) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>School Settings</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No School ID</Text>
          <Text style={styles.emptyText}>Could not determine your school. Contact support.</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>School Settings</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>School Settings</Text>
        <TouchableOpacity onPress={() => { setBatchInput(''); setShowBatchModal(true); }} style={styles.addBtn}>
          <Ionicons name="layers-outline" size={22} color="#e35336" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'settings' && styles.activeTab]} onPress={() => setTab('settings')}>
          <Text style={[styles.tabText, tab === 'settings' && styles.activeTabText]}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'info' && styles.activeTab]} onPress={() => setTab('info')}>
          <Text style={[styles.tabText, tab === 'info' && styles.activeTabText]}>School Info</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyTitle}>Error</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadAll}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : tab === 'settings' ? (
          settings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cog-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Settings</Text>
              <Text style={styles.emptyText}>No school settings have been configured yet.</Text>
            </View>
          ) : (
            settings.map(s => (
              <View key={s.key} style={styles.settingCard}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingKey}>{s.key.replace(/_/g, ' ')}</Text>
                  {s.description && <Text style={styles.settingDesc}>{s.description}</Text>}
                  <View style={styles.settingValueRow}>
                    <Text style={styles.settingValueLabel}>Value: </Text>
                    <Text style={styles.settingValue} numberOfLines={2}>{s.value}</Text>
                  </View>
                  {s.updatedAt && <Text style={styles.settingDate}>Updated {formatDate(s.updatedAt)}</Text>}
                </View>
                <View style={styles.settingActions}>
                  <TouchableOpacity onPress={() => openEditSetting(s)} style={styles.settingActionBtn}>
                    <Ionicons name="create-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteSetting(s.key)} style={styles.settingActionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        ) : (
          schoolInfo ? (
            <View style={styles.infoCard}>
              {!editInfo ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>{schoolInfo.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Code</Text>
                    <Text style={styles.infoValue}>{schoolInfo.code || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>{schoolInfo.address || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{schoolInfo.phone || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{schoolInfo.email || '-'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Website</Text>
                    <Text style={styles.infoValue}>{schoolInfo.website || '-'}</Text>
                  </View>
                  <TouchableOpacity style={styles.editInfoBtn} onPress={() => setEditInfo(true)}>
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.editInfoBtnText}>Edit School Info</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TextInput style={styles.input} placeholder="School Name" value={infoForm.name} onChangeText={t => setInfoForm(p => ({ ...p, name: t }))} placeholderTextColor="#9CA3AF" />
                  <TextInput style={styles.input} placeholder="Address" value={infoForm.address} onChangeText={t => setInfoForm(p => ({ ...p, address: t }))} placeholderTextColor="#9CA3AF" />
                  <TextInput style={styles.input} placeholder="Phone" value={infoForm.phone} onChangeText={t => setInfoForm(p => ({ ...p, phone: t }))} placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
                  <TextInput style={styles.input} placeholder="Email" value={infoForm.email} onChangeText={t => setInfoForm(p => ({ ...p, email: t }))} placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
                  <TextInput style={styles.input} placeholder="Website" value={infoForm.website} onChangeText={t => setInfoForm(p => ({ ...p, website: t }))} placeholderTextColor="#9CA3AF" autoCapitalize="none" />
                  <View style={styles.infoEditActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditInfo(false); setInfoForm({ name: schoolInfo.name, address: schoolInfo.address || '', phone: schoolInfo.phone || '', email: schoolInfo.email || '', website: schoolInfo.website || '' }); }}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveInfoBtn} onPress={saveSchoolInfo} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveInfoBtnText}>Save</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No School Info</Text>
              <Text style={styles.emptyText}>Unable to load school information.</Text>
            </View>
          )
        )}
      </ScrollView>

      <Modal visible={showSettingModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit: {editSetting?.key?.replace(/_/g, ' ')}</Text>
              <TouchableOpacity onPress={() => setShowSettingModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={settingValue}
              onChangeText={setSettingValue}
              multiline
              placeholder="Enter value"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={saveSetting} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Setting</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBatchModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Batch Update Settings</Text>
              <TouchableOpacity onPress={() => setShowBatchModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <Text style={styles.batchHint}>Enter settings as JSON: {`{"key1": "value1", "key2": "value2"}`}</Text>
            <TextInput
              style={[styles.input, styles.batchInput]}
              value={batchInput}
              onChangeText={setBatchInput}
              multiline
              placeholder='{"school_name": "New Name", "timezone": "UTC"}'
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleBatchUpdate} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Batch Update</Text>}
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
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#e35336' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
  retryBtn: { marginTop: 12, backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  settingCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  settingInfo: { flex: 1 },
  settingKey: { fontSize: 15, fontWeight: '700', color: '#111827', textTransform: 'capitalize' },
  settingDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  settingValueRow: { flexDirection: 'row', marginTop: 6, alignItems: 'flex-start' },
  settingValueLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  settingValue: { fontSize: 13, color: '#374151', flex: 1 },
  settingDate: { fontSize: 11, color: '#D1D5DB', marginTop: 4 },
  settingActions: { justifyContent: 'flex-start', gap: 12, paddingLeft: 8 },
  settingActionBtn: { padding: 4 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { width: 80, fontSize: 13, fontWeight: '600', color: '#6B7280' },
  infoValue: { flex: 1, fontSize: 14, color: '#111827' },
  editInfoBtn: { flexDirection: 'row', backgroundColor: '#e35336', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  editInfoBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, fontSize: 15, color: '#111827' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  batchInput: { minHeight: 120, textAlignVertical: 'top', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13 },
  batchHint: { fontSize: 12, color: '#6B7280', marginBottom: 12, lineHeight: 16 },
  infoEditActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  saveInfoBtn: { flex: 1, backgroundColor: '#e35336', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveInfoBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, marginRight: 12 },
  saveBtn: { backgroundColor: '#e35336', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
