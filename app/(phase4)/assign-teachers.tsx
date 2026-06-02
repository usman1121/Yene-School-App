import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

interface Subject {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  staffId?: string;
}

interface MatrixCell {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  assignmentId?: string;
  teacherId?: string;
  teacherName?: string;
}

export default function AssignTeachersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [matrix, setMatrix] = useState<MatrixCell[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [matrixRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('/class-subjects/matrix'),
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers'),
      ]);
      setMatrix(extractList(matrixRes) as MatrixCell[]);
      setClasses(extractList(classesRes) as ClassItem[]);
      setSubjects(extractList(subjectsRes) as Subject[]);
      setTeachers(extractList(teachersRes) as Teacher[]);
    } catch (error: any) {
      console.error('Failed to load matrix data:', error);
      setError(error?.response?.data?.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditId(null);
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedTeacher('');
    setModalVisible(true);
  };

  const openEdit = (cell: MatrixCell) => {
    setEditId(cell.assignmentId || null);
    setSelectedClass(cell.classId);
    setSelectedSubject(cell.subjectId);
    setSelectedTeacher(cell.teacherId || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedSubject || !selectedTeacher) {
      Alert.alert('Error', 'Please select class, subject, and teacher.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        classId: selectedClass,
        subjectId: selectedSubject,
        sectionId: 'A',
        academicYearId: new Date().getFullYear().toString(),
        teacherId: selectedTeacher,
      };
      if (editId) {
        await api.put(`/class-subjects/${editId}`, { teacherId: selectedTeacher });
      } else {
        await api.post('/class-subjects', payload);
      }
      setModalVisible(false);
      Alert.alert('Success', editId ? 'Assignment updated.' : 'Teacher assigned.');
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this teacher assignment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/class-subjects/${id}`);
            await fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete assignment.');
          }
        },
      },
    ]);
  };

  const handleBulkAssign = () => {
    if (!selectedTeacher) { Alert.alert('Error', 'Select a teacher first.'); return; }
    Alert.alert('Bulk Assign', `Assign selected teacher to all unassigned subjects across all classes?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Assign All', onPress: async () => {
          setSaving(true);
          try {
            const unassigned = matrix.filter(m => !m.teacherId);
            await Promise.all(
              unassigned.map(m =>
                api.post('/class-subjects', {
                  classId: m.classId,
                  subjectId: m.subjectId,
                  sectionId: 'A',
                  academicYearId: new Date().getFullYear().toString(),
                  teacherId: selectedTeacher,
                })
              )
            );
            Alert.alert('Success', `${unassigned.length} assignments created.`);
            setModalVisible(false);
            await fetchData();
          } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Bulk assign failed.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const getAssignedTeacher = (classId: string, subjectId: string) => {
    const cell = matrix.find((m) => m.classId === classId && m.subjectId === subjectId);
    return cell || null;
  };

  const renderMatrix = () => {
    if (classes.length === 0 || subjects.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No classes or subjects available</Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.matrixHeader}>
            <View style={styles.matrixCorner}>
              <Text style={styles.matrixCornerText}>Class \ Subject</Text>
            </View>
            {subjects.map((subj) => (
              <View key={subj.id} style={styles.matrixColHeader}>
                <Text style={styles.matrixColText} numberOfLines={2}>{subj.name}</Text>
              </View>
            ))}
          </View>
          {classes.map((cls) => (
            <View key={cls.id} style={styles.matrixRow}>
              <View style={styles.matrixRowHeader}>
                <Text style={styles.matrixRowText} numberOfLines={1}>{cls.name}</Text>
              </View>
              {subjects.map((subj) => {
                const cell = getAssignedTeacher(cls.id, subj.id);
                return (
                  <TouchableOpacity
                    key={`${cls.id}-${subj.id}`}
                    style={[styles.matrixCell, cell?.teacherId && styles.matrixCellFilled]}
                    onPress={() => {
                      if (cell) openEdit(cell);
                      else {
                        setEditId(null);
                        setSelectedClass(cls.id);
                        setSelectedSubject(subj.id);
                        setSelectedTeacher('');
                        setModalVisible(true);
                      }
                    }}
                    onLongPress={() => cell?.assignmentId && handleDelete(cell.assignmentId)}
                  >
                    {cell?.teacherName ? (
                      <Text style={styles.cellTeacherText} numberOfLines={2}>{cell.teacherName}</Text>
                    ) : (
                      <Ionicons name="add-circle-outline" size={18} color="#D1D5DB" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Teachers</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
        ) : error ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchData(); }}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderMatrix()
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editId ? 'Edit Assignment' : 'Assign Teacher'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {!editId && (
                <>
                  <Text style={styles.fieldLabel}>Class</Text>
                  <View style={styles.pickerRow}>
                    {classes.map((cls) => (
                      <TouchableOpacity
                        key={cls.id}
                        style={[styles.pickerOption, selectedClass === cls.id && styles.pickerOptionActive]}
                        onPress={() => setSelectedClass(cls.id)}
                      >
                        <Text style={[styles.pickerOptionText, selectedClass === cls.id && styles.pickerOptionTextActive]}>{cls.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Subject</Text>
                  <View style={styles.pickerRow}>
                    {subjects.map((subj) => (
                      <TouchableOpacity
                        key={subj.id}
                        style={[styles.pickerOption, selectedSubject === subj.id && styles.pickerOptionActive]}
                        onPress={() => setSelectedSubject(subj.id)}
                      >
                        <Text style={[styles.pickerOptionText, selectedSubject === subj.id && styles.pickerOptionTextActive]}>{subj.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.fieldLabel}>Teacher</Text>
              <View style={styles.pickerRow}>
                {teachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerOption, selectedTeacher === t.id && styles.pickerOptionActive]}
                    onPress={() => setSelectedTeacher(t.id)}
                  >
                    <Text style={[styles.pickerOptionText, selectedTeacher === t.id && styles.pickerOptionTextActive]}>
                      {t.firstName} {t.lastName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!editId && (
                <TouchableOpacity style={styles.bulkBtn} onPress={handleBulkAssign} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.bulkBtnText}>Bulk Assign to All Unassigned</Text>}
                </TouchableOpacity>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  matrixHeader: { flexDirection: 'row', marginBottom: 4 },
  matrixCorner: { width: 100, justifyContent: 'center', paddingHorizontal: 8 },
  matrixCornerText: { fontSize: 10, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3 },
  matrixColHeader: { width: 80, padding: 6, alignItems: 'center', justifyContent: 'center' },
  matrixColText: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  matrixRow: { flexDirection: 'row', marginBottom: 4 },
  matrixRowHeader: { width: 100, justifyContent: 'center', paddingHorizontal: 8 },
  matrixRowText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  matrixCell: { width: 80, height: 48, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 1 },
  matrixCellFilled: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  cellTeacherText: { fontSize: 10, fontWeight: '500', color: '#e35336', textAlign: 'center', paddingHorizontal: 2 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  retryBtn: { marginTop: 12, backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  bulkBtn: { backgroundColor: '#e35336', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginBottom: 8 },
  bulkBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
