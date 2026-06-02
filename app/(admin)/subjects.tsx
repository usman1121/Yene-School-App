import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminSubjectsApi, adminClassesApi } from '@/api';
import api from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import type { Subject, Class } from '@/types';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

export default function AdminSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  const [assignClassId, setAssignClassId] = useState('');
  const [assignSectionId, setAssignSectionId] = useState('');
  const [assignAcademicYearId, setAssignAcademicYearId] = useState('');
  const [assignTeacherId, setAssignTeacherId] = useState('');

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await adminSubjectsApi.getSubjects();
      setSubjects(extractList(res) as Subject[]);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  }, [fetchSubjects]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await adminClassesApi.getClasses();
      setClasses(extractList(res) as Class[]);
    } catch {}
  }, []);

  const handleCreate = async () => {
    if (!createName) {
      Alert.alert('Validation', 'Subject name is required');
      return;
    }
    setSubmitting(true);
    try {
      const data: any = { name: createName };
      if (createCode) data.code = createCode;
      await adminSubjectsApi.createSubject(data);
      Alert.alert('Success', 'Subject created');
      setShowCreateModal(false);
      setCreateName('');
      setCreateCode('');
      fetchSubjects();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSubject) return;
    setSubmitting(true);
    try {
      const data: any = {};
      if (editName) data.name = editName;
      if (editCode) data.code = editCode;
      await adminSubjectsApi.updateSubject(selectedSubject.id, data);
      Alert.alert('Success', 'Subject updated');
      setShowEditModal(false);
      setSelectedSubject(null);
      fetchSubjects();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (subject: Subject) => {
    Alert.alert(
      'Delete Subject',
      `Are you sure you want to delete ${subject.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminSubjectsApi.deleteSubject(subject.id);
              Alert.alert('Success', 'Subject deleted');
              setShowEditModal(false);
              setSelectedSubject(null);
              fetchSubjects();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete subject');
            }
          },
        },
      ]
    );
  };

  const handleAssign = async () => {
    if (!selectedSubject || !assignClassId) {
      Alert.alert('Validation', 'Please select a class');
      return;
    }
    setSubmitting(true);
    try {
      await adminSubjectsApi.assignToClass({
        classId: assignClassId,
        subjectId: selectedSubject.id,
        sectionId: assignSectionId,
        academicYearId: assignAcademicYearId,
        teacherId: assignTeacherId || undefined,
      });
      Alert.alert('Success', 'Subject assigned to class');
      setShowAssignModal(false);
      setAssignClassId('');
      setAssignSectionId('');
      setAssignAcademicYearId('');
      setAssignTeacherId('');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to assign subject');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setEditName(subject.name);
    setEditCode(subject.code || '');
    setShowEditModal(true);
  };

  const openAssignModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setAssignClassId('');
    setAssignSectionId('');
    setAssignAcademicYearId('');
    setAssignTeacherId('');
    fetchClasses();
    setShowAssignModal(true);
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
        <Text style={styles.headerTitle}>Subjects</Text>
        <Text style={styles.headerSubtext}>{subjects.length} subject(s)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No subjects found</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <TouchableOpacity key={subject.id} style={styles.subjectCard} onPress={() => openEditModal(subject)}>
              <View style={[styles.subjectIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="book" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                {subject.code ? <Text style={styles.subjectCode}>Code: {subject.code}</Text> : null}
              </View>
              <TouchableOpacity style={styles.assignBtn} onPress={() => openAssignModal(subject)}>
                <Text style={styles.assignText}>Assign</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => { setCreateName(''); setCreateCode(''); setShowCreateModal(true); }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Subject</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Subject Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Mathematics" placeholderTextColor="#9CA3AF" value={createName} onChangeText={setCreateName} />

            <Text style={styles.label}>Code (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. MATH101" placeholderTextColor="#9CA3AF" value={createCode} onChangeText={setCreateCode} autoCapitalize="characters" />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Subject</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Subject</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedSubject(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSubject && (
              <>
                <Text style={styles.label}>Subject Name</Text>
                <TextInput style={styles.input} placeholder="Subject name" placeholderTextColor="#9CA3AF" value={editName} onChangeText={setEditName} />

                <Text style={styles.label}>Code</Text>
                <TextInput style={styles.input} placeholder="Subject code" placeholderTextColor="#9CA3AF" value={editCode} onChangeText={setEditCode} autoCapitalize="characters" />

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleUpdate} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedSubject)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Subject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showAssignModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Class</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedSubject && <Text style={styles.assignSubjectLabel}>Subject: {selectedSubject.name}</Text>}

            <Text style={styles.label}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {classes.map((cls) => (
                <TouchableOpacity key={cls.id} style={[styles.pickerChip, assignClassId === cls.id && styles.pickerChipActive]} onPress={() => setAssignClassId(cls.id)}>
                  <Text style={[styles.pickerChipText, assignClassId === cls.id && styles.pickerChipTextActive]}>{cls.name}</Text>
                </TouchableOpacity>
              ))}
              {classes.length === 0 && <Text style={styles.noOptions}>No classes available</Text>}
            </ScrollView>

            <Text style={styles.label}>Section ID (optional)</Text>
            <TextInput style={styles.input} placeholder="Section ID" placeholderTextColor="#9CA3AF" value={assignSectionId} onChangeText={setAssignSectionId} />

            <Text style={styles.label}>Academic Year ID (optional)</Text>
            <TextInput style={styles.input} placeholder="Academic Year ID" placeholderTextColor="#9CA3AF" value={assignAcademicYearId} onChangeText={setAssignAcademicYearId} />

            <Text style={styles.label}>Teacher ID (optional)</Text>
            <TextInput style={styles.input} placeholder="Teacher ID" placeholderTextColor="#9CA3AF" value={assignTeacherId} onChangeText={setAssignTeacherId} />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleAssign} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Assign to Class</Text>}
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
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  subjectIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  subjectCode: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  assignBtn: { backgroundColor: '#F3F4F6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginRight: 8 },
  assignText: { fontSize: 12, fontWeight: '600', color: '#e35336' },
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
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' },
  deleteText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
  assignSubjectLabel: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  pickerRow: { marginBottom: 4 },
  pickerChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  pickerChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  pickerChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pickerChipTextActive: { color: '#FFFFFF' },
  noOptions: { fontSize: 13, color: '#9CA3AF' },
});
