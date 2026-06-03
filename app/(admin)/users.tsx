import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminUsersApi } from '@/api';
import api from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@/types';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

type UserTab = 'ALL' | 'TEACHER' | 'STUDENT' | 'REGISTRAR' | 'FINANCE';

const ROLES = ['TEACHER', 'STUDENT', 'PARENT', 'REGISTRAR', 'FINANCE'] as const;

export default function AdminUsersScreen() {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<UserTab>('ALL');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<string>('TEACHER');
  const [tempPassword, setTempPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const params: any = {};
      if (activeTab !== 'ALL') params.role = activeTab;
      const res = await adminUsersApi.getUsers(params);
      setUsers(extractList(res) as User[]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const filtered = users.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: UserTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'TEACHER', label: 'Teachers' },
    { key: 'STUDENT', label: 'Students' },
    { key: 'REGISTRAR', label: 'Registrar' },
    { key: 'FINANCE', label: 'Finance' },
  ];

  const resetCreateForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('TEACHER');
  };

  const resetEditForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
  };

  const handleCreate = async () => {
    if (!formName || !formEmail) {
      Alert.alert('Validation', 'Name and email are required');
      return;
    }
    if (formRole !== 'TEACHER' && !formPassword) {
      Alert.alert('Validation', 'Password is required for this role');
      return;
    }
    setSubmitting(true);
    try {
      const data: any = { name: formName, email: formEmail };
      if (formRole === 'TEACHER') {
        await adminUsersApi.createTeacher(data);
      } else if (formRole === 'STUDENT') {
        await adminUsersApi.createStudent({ ...data, password: formPassword });
      } else if (formRole === 'PARENT') {
        await adminUsersApi.createParent({ ...data, password: formPassword });
      } else if (formRole === 'REGISTRAR') {
        await adminUsersApi.createRegistrar({ ...data, password: formPassword });
      } else if (formRole === 'FINANCE') {
        await api.post('/auth/register/finance', { ...data, password: formPassword });
      }
      Alert.alert('Success', 'User created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const data: any = {};
      if (formName) data.name = formName;
      if (formEmail) data.email = formEmail;
      if (formPhone) data.phone = formPhone;
      await api.put(`/auth/users/${selectedUser.id}`, data);
      Alert.alert('Success', 'User updated');
      setShowEditModal(false);
      setSelectedUser(null);
      resetEditForm();
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/auth/users/${user.id}`);
              Alert.alert('Success', 'User deleted');
              setShowEditModal(false);
              setSelectedUser(null);
              fetchUsers();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !tempPassword) {
      Alert.alert('Validation', 'Please enter a temporary password');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/auth/admin/reset-user-password/${selectedUser.id}`, { temporaryPassword: tempPassword });
      Alert.alert('Success', 'Password reset successfully');
      setShowPasswordModal(false);
      setTempPassword('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormName(user.name || '');
    setFormEmail(user.email || '');
    setFormPhone(user.phone || '');
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSubtext}>{filtered.length} user(s)</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput style={styles.searchInput} placeholder="Search by name or email..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.key} style={[styles.tab, activeTab === tab.key && styles.tabActive]} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filtered.map((user) => (
            <TouchableOpacity key={user.id} style={styles.userCard} onPress={() => openEditModal(user)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user.name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => { resetCreateForm(); setShowCreateModal(true); }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create User</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Role</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rolePicker}>
              {ROLES.map((r) => (
                <TouchableOpacity key={r} style={[styles.roleChip, formRole === r && styles.roleChipActive]} onPress={() => setFormRole(r)}>
                  <Text style={[styles.roleChipText, formRole === r && styles.roleChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#9CA3AF" value={formName} onChangeText={setFormName} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#9CA3AF" value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />

            {formRole !== 'TEACHER' && (
              <>
                <Text style={styles.label}>Password</Text>
                <TextInput style={styles.input} placeholder="Temporary password" placeholderTextColor="#9CA3AF" value={formPassword} onChangeText={setFormPassword} secureTextEntry />
              </>
            )}

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create User</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedUser(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedUser && (
              <>
                <View style={styles.editUserInfo}>
                  <View style={[styles.avatar, { width: 60, height: 60, borderRadius: 30 }]}>
                    <Text style={[styles.avatarText, { fontSize: 24 }]}>{selectedUser.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <Text style={styles.editUserRole}>{selectedUser.role}</Text>
                </View>

                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#9CA3AF" value={formName} onChangeText={setFormName} />

                <Text style={styles.label}>Email</Text>
                <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#9CA3AF" value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />

                <Text style={styles.label}>Phone</Text>
                <TextInput style={styles.input} placeholder="Phone number" placeholderTextColor="#9CA3AF" value={formPhone} onChangeText={setFormPhone} keyboardType="phone-pad" />

                <View style={styles.editActions}>
                  <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} onPress={handleUpdate} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Save Changes</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetPwdBtn} onPress={() => { setShowPasswordModal(true); setTempPassword(''); }}>
                    <Ionicons name="key-outline" size={18} color="#e35336" />
                    <Text style={styles.resetPwdText}>Reset Password</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedUser)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete User</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedUser && <Text style={styles.passwordFor}>For: {selectedUser.name}</Text>}

            <Text style={styles.label}>Temporary Password</Text>
            <TextInput style={styles.input} placeholder="Enter new temporary password" placeholderTextColor="#9CA3AF" value={tempPassword} onChangeText={setTempPassword} secureTextEntry />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleResetPassword} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Reset Password</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  tabBar: { paddingHorizontal: 16, paddingBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  tabActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  tabText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  roleText: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827' },
  submitBtn: { backgroundColor: '#e35336', borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  rolePicker: { marginBottom: 4 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  roleChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  roleChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  roleChipTextActive: { color: '#FFFFFF' },
  editUserInfo: { alignItems: 'center', marginBottom: 16 },
  editUserRole: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 8, textTransform: 'uppercase' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  resetPwdBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: '#e35336', borderRadius: 10, paddingVertical: 14, flex: 1 },
  resetPwdText: { color: '#e35336', fontSize: 14, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  passwordFor: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
});
