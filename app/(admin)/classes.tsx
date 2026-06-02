import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminClassesApi, adminSectionsApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import type { Class, Section } from '@/types';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

export default function AdminClassesScreen() {
  const insets = useSafeAreaInsets();
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createGrade, setCreateGrade] = useState('');
  const [editName, setEditName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [sectionCapacity, setSectionCapacity] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await adminClassesApi.getClasses();
      const data = extractList(res) as Class[];
      setClasses(data);
      const sectionMap: Record<string, Section[]> = {};
      await Promise.all(data.map(async (cls) => {
        try {
          const secRes = await adminSectionsApi.getSections(cls.id);
          sectionMap[cls.id] = extractList(secRes) as Section[];
        } catch { sectionMap[cls.id] = []; }
      }));
      setSections(sectionMap);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
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

  const toggleExpand = (classId: string) => {
    setExpandedClass(expandedClass === classId ? null : classId);
  };

  const handleCreateClass = async () => {
    if (!createName || !createGrade) {
      Alert.alert('Validation', 'Name and grade are required');
      return;
    }
    const grade = parseInt(createGrade, 10);
    if (isNaN(grade)) {
      Alert.alert('Validation', 'Grade must be a number');
      return;
    }
    setSubmitting(true);
    try {
      await adminClassesApi.createClass({ name: createName, grade, section: 'A', academicYearId: '' });
      Alert.alert('Success', 'Class created');
      setShowCreateModal(false);
      setCreateName('');
      setCreateGrade('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClass = async () => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      const data: any = {};
      if (editName) data.name = editName;
      if (editGrade) data.grade = parseInt(editGrade, 10);
      await adminClassesApi.updateClass(selectedClass.id, data);
      Alert.alert('Success', 'Class updated');
      setShowEditModal(false);
      setSelectedClass(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = (cls: Class) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete ${cls.name}? All associated sections will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminClassesApi.deleteClass(cls.id);
              Alert.alert('Success', 'Class deleted');
              setShowEditModal(false);
              setSelectedClass(null);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete class');
            }
          },
        },
      ]
    );
  };

  const handleCreateSection = async () => {
    if (!selectedClass || !sectionName) {
      Alert.alert('Validation', 'Section name is required');
      return;
    }
    setSubmitting(true);
    try {
      const data: any = { name: sectionName, classId: selectedClass.id };
      if (sectionCapacity) data.capacity = parseInt(sectionCapacity, 10);
      await adminSectionsApi.createSection(data);
      Alert.alert('Success', 'Section created');
      setShowSectionModal(false);
      setSectionName('');
      setSectionCapacity('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = (section: Section) => {
    Alert.alert(
      'Delete Section',
      `Are you sure you want to delete Section ${section.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminSectionsApi.deleteSection(section.id);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete section');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (cls: Class) => {
    setSelectedClass(cls);
    setEditName(cls.name);
    setEditGrade(String(cls.grade));
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
        <Text style={styles.headerTitle}>Classes</Text>
        <Text style={styles.headerSubtext}>{classes.length} class(es)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        ) : (
          classes.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <TouchableOpacity style={styles.classHeader} onPress={() => toggleExpand(cls.id)}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classGrade}>Grade {cls.grade}</Text>
                </View>
                <View style={styles.classMeta}>
                  <Text style={styles.sectionCount}>{sections[cls.id]?.length || 0} sections</Text>
                  <Ionicons name={expandedClass === cls.id ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
              {expandedClass === cls.id && (
                <View style={styles.sectionList}>
                  <TouchableOpacity style={styles.addSectionBtn} onPress={() => { setSelectedClass(cls); setSectionName(''); setSectionCapacity(''); setShowSectionModal(true); }}>
                    <Ionicons name="add-circle-outline" size={16} color="#e35336" />
                    <Text style={styles.addSectionText}>Add Section</Text>
                  </TouchableOpacity>
                  {(sections[cls.id] || []).length > 0 ? (
                    sections[cls.id].map((sec) => (
                      <View key={sec.id} style={styles.sectionItem}>
                        <View>
                          <Text style={styles.sectionName}>Section {sec.name}</Text>
                          {sec.capacity ? <Text style={styles.sectionCapacity}>Capacity: {sec.capacity}</Text> : null}
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteSection(sec)}>
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noSections}>No sections yet</Text>
                  )}
                  <TouchableOpacity style={styles.editClassLink} onPress={() => openEditModal(cls)}>
                    <Ionicons name="create-outline" size={14} color="#6B7280" />
                    <Text style={styles.editClassLinkText}>Edit Class</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => { setCreateName(''); setCreateGrade(''); setShowCreateModal(true); }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Class</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Class Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Grade 9 A" placeholderTextColor="#9CA3AF" value={createName} onChangeText={setCreateName} />

            <Text style={styles.label}>Grade</Text>
            <TextInput style={styles.input} placeholder="e.g. 9" placeholderTextColor="#9CA3AF" value={createGrade} onChangeText={setCreateGrade} keyboardType="number-pad" />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreateClass} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Class</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Class</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedClass(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedClass && (
              <>
                <Text style={styles.label}>Class Name</Text>
                <TextInput style={styles.input} placeholder="Class name" placeholderTextColor="#9CA3AF" value={editName} onChangeText={setEditName} />

                <Text style={styles.label}>Grade</Text>
                <TextInput style={styles.input} placeholder="Grade number" placeholderTextColor="#9CA3AF" value={editGrade} onChangeText={setEditGrade} keyboardType="number-pad" />

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleEditClass} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteClass(selectedClass)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Class</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showSectionModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Section</Text>
              <TouchableOpacity onPress={() => setShowSectionModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedClass && <Text style={styles.sectionForClass}>For: {selectedClass.name}</Text>}

            <Text style={styles.label}>Section Name</Text>
            <TextInput style={styles.input} placeholder="e.g. A, B, C" placeholderTextColor="#9CA3AF" value={sectionName} onChangeText={setSectionName} />

            <Text style={styles.label}>Capacity (optional)</Text>
            <TextInput style={styles.input} placeholder="Max students" placeholderTextColor="#9CA3AF" value={sectionCapacity} onChangeText={setSectionCapacity} keyboardType="number-pad" />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreateSection} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Section</Text>}
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
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, overflow: 'hidden' },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: '#111827' },
  classGrade: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  classMeta: { alignItems: 'flex-end', gap: 4 },
  sectionCount: { fontSize: 12, color: '#6B7280' },
  sectionList: { borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 14 },
  sectionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  sectionName: { fontSize: 14, color: '#374151' },
  sectionCapacity: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  noSections: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
  addSectionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  addSectionText: { fontSize: 13, color: '#e35336', fontWeight: '500' },
  editClassLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'center' },
  editClassLinkText: { fontSize: 12, color: '#6B7280' },
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
  sectionForClass: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
});
