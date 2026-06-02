import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';
import { useAuth } from '@/contexts/AuthContext';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string;
  schoolName?: string;
  isActive?: boolean;
  phone?: string;
  createdAt?: string;
}

interface School {
  id: string;
  name: string;
  code?: string;
}

const TABS = ['Admins', 'IT Managers'] as const;

export default function SchoolAdminsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Admins');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', schoolId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [resetForm, setResetForm] = useState({ userId: '', newPassword: '' });
  const [showReset, setShowReset] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchAdmins = useCallback(async () => {
    try {
      const role = activeTab === 'Admins' ? 'ADMIN' : 'IT_MANAGER';
      const res = await api.get('/auth/users', { params: { role } });
      const data = res.data?.data || res.data || [];
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const fetchSchools = useCallback(async () => {
    try {
      const res = await api.get('/schools');
      const data = res.data?.data || res.data || [];
      setSchools(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  }, []);

  useEffect(() => { fetchSchools(); }, [fetchSchools]);
  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAdmins();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.schoolId) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      const endpoint = activeTab === 'Admins' ? '/auth/register/admin' : '/auth/register/it-manager';
      await api.post(endpoint, form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', schoolId: '' });
      Alert.alert('Success', `${activeTab === 'Admins' ? 'Admin' : 'IT Manager'} created successfully.`);
      fetchAdmins();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (admin: AdminUser) => {
    Alert.alert('Delete User', `Delete ${admin.name}? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/auth/users/${admin.id}`);
          Alert.alert('Success', 'User deleted.');
          fetchAdmins();
        } catch { Alert.alert('Error', 'Failed to delete user.'); }
      }},
    ]);
  };

  const handleResetPassword = async () => {
    if (!resetForm.userId || !resetForm.newPassword) {
      Alert.alert('Validation', 'Password is required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/auth/admin/reset-user-password/${resetForm.userId}`, { newPassword: resetForm.newPassword });
      setShowReset(false);
      setResetForm({ userId: '', newPassword: '' });
      Alert.alert('Success', 'Password reset successfully.');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const openReset = (admin: AdminUser) => {
    setResetForm({ userId: admin.id, newPassword: '' });
    setShowReset(true);
  };

  const getSchoolName = (schoolId?: string) => {
    if (!schoolId) return '—';
    const school = schools.find((s) => s.id === schoolId);
    return school?.name || schoolId;
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Admins</Text>
        <View style={styles.headerActions}>
          {isSuperAdmin && (
            <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => { setActiveTab(tab); setLoading(true); }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : admins.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} found</Text>
          </View>
        ) : (
          admins.map((admin) => (
            <View key={admin.id} style={styles.adminCard}>
              <View style={styles.adminRow}>
                <View style={styles.adminAvatar}>
                  <Ionicons name="shield" size={22} color="#7C3AED" />
                </View>
                <View style={styles.adminInfo}>
                  <Text style={styles.adminName}>{admin.name}</Text>
                  <Text style={styles.adminEmail}>{admin.email}</Text>
                  <View style={styles.adminMetaRow}>
                    <View style={styles.schoolBadge}>
                      <Ionicons name="business-outline" size={12} color="#6B7280" />
                      <Text style={styles.schoolBadgeText}>{getSchoolName(admin.schoolId)}</Text>
                    </View>
                    {admin.createdAt && (
                      <Text style={styles.adminDate}>{formatDate(admin.createdAt)}</Text>
                    )}
                  </View>
                </View>
                {isSuperAdmin && (
                  <View style={styles.adminActions}>
                    <TouchableOpacity onPress={() => openReset(admin)} style={styles.iconBtn}>
                      <Ionicons name="key-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(admin)} style={styles.iconBtn}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.modalTitle}>Create {activeTab === 'Admins' ? 'Admin' : 'IT Manager'}</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={form.email}
                onChangeText={(v) => setForm({ ...form, email: v })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={form.password}
                onChangeText={(v) => setForm({ ...form, password: v })}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />

              <Text style={styles.label}>School</Text>
              <View style={styles.schoolPickerRow}>
                {schools.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.schoolOption, form.schoolId === s.id && styles.schoolOptionActive]}
                    onPress={() => setForm({ ...form, schoolId: s.id })}
                  >
                    <Text style={[styles.schoolOptionText, form.schoolId === s.id && styles.schoolOptionTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={handleCreate} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Create</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showReset} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowReset(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={resetForm.newPassword}
              onChangeText={(v) => setResetForm({ ...resetForm, newPassword: v })}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReset(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={handleResetPassword} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Reset</Text>}
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
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#e35336' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: '#e35336' },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  adminCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  adminRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  adminInfo: { flex: 1 },
  adminName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  adminEmail: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  adminMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  schoolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  schoolBadgeText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  adminDate: { fontSize: 11, color: '#9CA3AF' },
  adminActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  schoolPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  schoolOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  schoolOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  schoolOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  schoolOptionTextActive: { color: '#e35336' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
