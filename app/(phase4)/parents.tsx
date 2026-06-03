import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';
import { useAuth } from '@/contexts/AuthContext';

interface Parent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  childrenCount?: number;
  linkedStudents?: { id: string; name: string; className?: string }[];
  avatarUrl?: string;
}

export default function ParentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState<'create' | 'link' | null>(null);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [detailParent, setDetailParent] = useState<Parent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [linkForm, setLinkForm] = useState({ parentId: '', studentId: '' });

  const canManage = user && ['ADMIN', 'SUPER_ADMIN', 'IT_MANAGER'].includes(user.role);

  const fetchParents = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/parents', { params });
      const data = res.data?.data || res.data || [];
      setParents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch parents:', error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchParents(); }, [fetchParents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchParents();
    setRefreshing(false);
  };

  const handleViewDetails = async (parent: Parent) => {
    try {
      const res = await api.get(`/parents/${parent.id}`);
      const data = res.data?.data || res.data;
      setDetailParent(data || parent);
    } catch {
      setDetailParent(parent);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Validation', 'Name and email are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/parents', form);
      setShowModal(null);
      setForm({ name: '', email: '', phone: '' });
      Alert.alert('Success', 'Parent created.');
      fetchParents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create parent.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedParent) return;
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Validation', 'Name and email are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/parents/${selectedParent.id}`, form);
      setShowModal(null);
      setSelectedParent(null);
      setForm({ name: '', email: '', phone: '' });
      Alert.alert('Success', 'Parent updated.');
      fetchParents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update parent.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLink = async () => {
    if (!linkForm.parentId || !linkForm.studentId) {
      Alert.alert('Validation', 'Parent ID and Student ID are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/parents/link', linkForm);
      setShowModal(null);
      setLinkForm({ parentId: '', studentId: '' });
      Alert.alert('Success', 'Parent linked to student.');
      fetchParents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to link parent.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlink = (parentId: string, studentId: string) => {
    Alert.alert('Unlink', 'Unlink this parent from student?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unlink', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/parents/unlink/${parentId}/${studentId}`);
          Alert.alert('Success', 'Parent unlinked.');
          fetchParents();
        } catch { Alert.alert('Error', 'Failed to unlink.'); }
      }},
    ]);
  };

  const handleCreateAndLink = async () => {
    if (!form.name.trim() || !form.email.trim() || !linkForm.studentId) {
      Alert.alert('Validation', 'Name, email, and student ID are required.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/parents/create-and-link', { ...form, studentId: linkForm.studentId });
      setShowModal(null);
      setForm({ name: '', email: '', phone: '' });
      setLinkForm({ parentId: '', studentId: '' });
      Alert.alert('Success', 'Parent created and linked.');
      fetchParents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setForm({ name: parent.name, email: parent.email, phone: parent.phone || '' });
    setShowModal('create');
  };

  const filtered = parents.filter((p) =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parents</Text>
        <View style={styles.headerActions}>
          {canManage && (
            <>
              <TouchableOpacity onPress={() => { setSelectedParent(null); setForm({ name: '', email: '', phone: '' }); setShowModal('create'); }} style={styles.addBtn}>
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setLinkForm({ parentId: '', studentId: '' }); setShowModal('link'); }} style={styles.linkBtn}>
                <Ionicons name="link" size={20} color="#e35336" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search parents..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>{search ? 'No matching parents' : 'No parents found'}</Text>
          </View>
        ) : (
          filtered.map((parent) => (
            <TouchableOpacity key={parent.id} style={styles.parentCard} onPress={() => handleViewDetails(parent)}>
              <View style={styles.parentHeader}>
                <View style={styles.parentAvatar}>
                  <Ionicons name="person" size={22} color="#e35336" />
                </View>
                <View style={styles.parentInfo}>
                  <Text style={styles.parentName}>{parent.name}</Text>
                  <Text style={styles.parentEmail}>{parent.email}</Text>
                  {parent.phone && <Text style={styles.parentPhone}>{parent.phone}</Text>}
                </View>
              </View>
              <View style={styles.parentMeta}>
                <View style={styles.childrenBadge}>
                  <Ionicons name="people" size={14} color="#6B7280" />
                  <Text style={styles.childrenCount}>{parent.childrenCount ?? parent.linkedStudents?.length ?? 0} children</Text>
                </View>
                {canManage && (
                  <View style={styles.parentActions}>
                    <TouchableOpacity onPress={() => openEdit(parent)} style={styles.iconBtn}>
                      <Ionicons name="create-outline" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {detailParent?.id === parent.id && detailParent?.linkedStudents && detailParent.linkedStudents.length > 0 && (
                <View style={styles.childrenList}>
                  {detailParent.linkedStudents.map((child: any) => (
                    <View key={child.id} style={styles.childRow}>
                      <Ionicons name="person-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.childName}>{child.name}</Text>
                      {child.className && <Text style={styles.childClass}>{child.className}</Text>}
                      {canManage && (
                        <TouchableOpacity onPress={() => handleUnlink(parent.id, child.id)}>
                          <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal === 'create'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>{selectedParent ? 'Edit Parent' : 'Create Parent'}</Text>
              <TouchableOpacity onPress={() => setShowModal(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Phone (optional)" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Student ID (to link, optional)" value={linkForm.studentId} onChangeText={(v) => setLinkForm({ ...linkForm, studentId: v })} placeholderTextColor="#9CA3AF" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={selectedParent ? handleUpdate : (linkForm.studentId ? handleCreateAndLink : handleCreate)} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>{selectedParent ? 'Update' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showModal === 'link'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.detailHeader}>
              <Text style={styles.modalTitle}>Link Parent to Student</Text>
              <TouchableOpacity onPress={() => setShowModal(null)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Parent ID" value={linkForm.parentId} onChangeText={(v) => setLinkForm({ ...linkForm, parentId: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Student ID" value={linkForm.studentId} onChangeText={(v) => setLinkForm({ ...linkForm, studentId: v })} placeholderTextColor="#9CA3AF" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={handleLink} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Link</Text>}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  linkBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  scrollContent: { padding: 16, paddingTop: 8, gap: 10 },
  parentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  parentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  parentAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  parentEmail: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  parentPhone: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  parentMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  childrenBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  childrenCount: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  parentActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 4 },
  childrenList: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, gap: 6 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  childName: { fontSize: 13, fontWeight: '500', color: '#374151', flex: 1 },
  childClass: { fontSize: 11, color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
