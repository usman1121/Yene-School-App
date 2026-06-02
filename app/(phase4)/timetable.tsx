import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subject?: { id: string; name: string };
  teacher?: { id: string; name: string };
  room?: string;
  section?: { id: string; name: string };
}

interface ClassItem {
  id: string;
  name: string;
  sections?: { id: string; name: string }[];
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_COLORS = ['#E3F2FD', '#F3E5F5', '#FFF3E0', '#E8F5E9', '#FCE4EC', '#E0F7FA', '#FFF8E1', '#F1F8E9'];

export default function TimetableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dayOfWeek: 0, periodNumber: 1, subjectId: '', teacherId: '', room: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);

  const isAdmin = user && ['ADMIN', 'SUPER_ADMIN', 'IT_MANAGER'].includes(user.role);

  const fetchInitialData = useCallback(async () => {
    try {
      const [clsRes, subRes, teachRes] = await Promise.all([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/teachers'),
      ]);
      setClasses(extractList(clsRes) as ClassItem[]);
      setSubjects(extractList(subRes) as Subject[]);
      setTeachers(extractList(teachRes) as Teacher[]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load classes, subjects, or teachers.');
    }
  }, []);

  const fetchTimetable = useCallback(async () => {
    if (!selectedClassId) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/timetable-slots/grid/class/${selectedClassId}${selectedSectionId ? `/section/${selectedSectionId}` : ''}`);
      setTimetable(extractList(res) as TimetableSlot[]);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch timetable:', error);
      setError(error?.response?.data?.message || 'Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedSectionId]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  const onRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([fetchInitialData(), fetchTimetable()]);
    } catch {
      setError('Refresh failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!form.subjectId) {
      Alert.alert('Validation', 'Please select a subject.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/timetable-slots', {
        classId: selectedClassId,
        sectionId: selectedSectionId || undefined,
        dayOfWeek: form.dayOfWeek,
        periodNumber: form.periodNumber,
        subjectId: form.subjectId,
        teacherId: form.teacherId || undefined,
        room: form.room || undefined,
      });
      setShowForm(false);
      setForm({ dayOfWeek: 0, periodNumber: 1, subjectId: '', teacherId: '', room: '' });
      Alert.alert('Success', 'Timetable slot created.');
      fetchTimetable();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoGenerate = () => {
    Alert.alert('Auto Generate', 'Generate entire timetable for this class?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Generate', onPress: async () => {
        try {
          await api.post('/timetable-slots/auto-generate', { classId: selectedClassId, academicYearId: undefined });
          Alert.alert('Success', 'Timetable auto-generated.');
          fetchTimetable();
        } catch (error: any) {
          Alert.alert('Error', error?.response?.data?.message || 'Failed to auto-generate.');
        }
      }},
    ]);
  };

  const handleDeleteAll = () => {
    if (!selectedSectionId) {
      Alert.alert('Validation', 'Select a section first.');
      return;
    }
    Alert.alert('Delete All', 'Delete all slots for this class and section?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/timetable-slots/class/${selectedClassId}/section/${selectedSectionId}`);
          Alert.alert('Success', 'All slots deleted.');
          fetchTimetable();
        } catch {
          Alert.alert('Error', 'Failed to delete slots.');
        }
      }},
    ]);
  };

  const handleDeleteSlot = (id: string) => {
    Alert.alert('Delete Slot', 'Delete this timetable slot?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/timetable-slots/${id}`);
          fetchTimetable();
        } catch { Alert.alert('Error', 'Failed to delete slot.'); }
      }},
    ]);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const sections = selectedClass?.sections || [];
  const maxPeriod = timetable.length > 0 ? Math.max(...timetable.map((s) => s.periodNumber), 1) : 1;
  const periodCount = Math.min(maxPeriod + 1, 10);

  const getSlot = (day: number, period: number) => {
    return timetable.find((s) => s.dayOfWeek === day && s.periodNumber === period);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timetable</Text>
        <View style={styles.headerActions}>
          {isAdmin && selectedClassId && (
            <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addBtn}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.classSelector}>
        <TouchableOpacity style={styles.classPicker} onPress={() => setShowClassPicker(true)}>
          <Ionicons name="school-outline" size={18} color="#6B7280" />
          <Text style={styles.classPickerText}>{selectedClass ? selectedClass.name : 'Select Class'}</Text>
          <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>
        {sections.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
            {sections.map((sec) => (
              <TouchableOpacity
                key={sec.id}
                style={[styles.sectionChip, selectedSectionId === sec.id && styles.sectionChipActive]}
                onPress={() => setSelectedSectionId(selectedSectionId === sec.id ? '' : sec.id)}
              >
                <Text style={[styles.sectionChipText, selectedSectionId === sec.id && styles.sectionChipTextActive]}>{sec.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {isAdmin && selectedClassId && sections.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAutoGenerate}>
            <Ionicons name="flash" size={16} color="#e35336" />
            <Text style={styles.actionBtnText}>Auto Generate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDeleteAll}>
            <Ionicons name="trash" size={16} color="#EF4444" />
            <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Delete All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        horizontal
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        <View>
          <View style={styles.gridRow}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodHeaderText}>Per</Text>
            </View>
            {DAYS.map((day, idx) => (
              <View key={idx} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day.slice(0, 3)}</Text>
              </View>
            ))}
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="large" color="#e35336" />
            </View>
          ) : error ? (
            <View style={styles.emptyGrid}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchTimetable(); }}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !selectedClassId ? (
            <View style={styles.emptyGrid}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Select a class to view timetable</Text>
            </View>
          ) : timetable.length === 0 ? (
            <View style={styles.emptyGrid}>
              <Ionicons name="time-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No slots yet{'\n'}Tap + to create one</Text>
            </View>
          ) : (
            Array.from({ length: periodCount }, (_, pi) => pi + 1).map((period) => (
              <View key={period} style={styles.gridRow}>
                <View style={styles.periodCell}>
                  <Text style={styles.periodNum}>{period}</Text>
                </View>
                {DAYS.map((_, day) => {
                  const slot = getSlot(day, period);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.slotCell, slot ? { backgroundColor: PERIOD_COLORS[(period - 1) % PERIOD_COLORS.length] } : styles.emptySlot]}
                      onPress={() => slot && handleDeleteSlot(slot.id)}
                      disabled={!slot}
                    >
                      {slot ? (
                        <View style={styles.slotContent}>
                          <Text style={styles.slotSubject} numberOfLines={1}>{slot.subject?.name || '—'}</Text>
                          {slot.teacher?.name && <Text style={styles.slotTeacher} numberOfLines={1}>{slot.teacher.name}</Text>}
                          {slot.section?.name && <Text style={styles.slotSection}>{slot.section.name}</Text>}
                          {slot.room && <Text style={styles.slotRoom}>{slot.room}</Text>}
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showClassPicker} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity onPress={() => setShowClassPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.classOption, selectedClassId === cls.id && styles.classOptionActive]}
                  onPress={() => { setSelectedClassId(cls.id); setSelectedSectionId(''); setShowClassPicker(false); setLoading(true); }}
                >
                  <Text style={[styles.classOptionText, selectedClassId === cls.id && styles.classOptionTextActive]}>{cls.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Timetable Slot</Text>

              <Text style={styles.label}>Day of Week</Text>
              <View style={styles.dayPickerRow}>
                {DAYS.map((day, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dayOption, form.dayOfWeek === idx && styles.dayOptionActive]}
                    onPress={() => setForm({ ...form, dayOfWeek: idx })}
                  >
                    <Text style={[styles.dayOptionText, form.dayOfWeek === idx && styles.dayOptionTextActive]}>{day.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Period Number</Text>
              <View style={styles.periodPickerRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.periodOption, form.periodNumber === p && styles.periodOptionActive]}
                    onPress={() => setForm({ ...form, periodNumber: p })}
                  >
                    <Text style={[styles.periodOptionText, form.periodNumber === p && styles.periodOptionTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Subject</Text>
              <View style={styles.pickerRow}>
                {subjects.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.pickerChip, form.subjectId === sub.id && styles.pickerChipActive]}
                    onPress={() => setForm({ ...form, subjectId: form.subjectId === sub.id ? '' : sub.id })}
                  >
                    <Text style={[styles.pickerChipText, form.subjectId === sub.id && styles.pickerChipTextActive]}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Teacher (optional)</Text>
              <View style={styles.pickerRow}>
                {teachers.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.pickerChip, form.teacherId === t.id && styles.pickerChipActive]}
                    onPress={() => setForm({ ...form, teacherId: form.teacherId === t.id ? '' : t.id })}
                  >
                    <Text style={[styles.pickerChipText, form.teacherId === t.id && styles.pickerChipTextActive]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Room (optional)"
                placeholderTextColor="#9CA3AF"
                value={form.room}
                onChangeText={(v) => setForm({ ...form, room: v })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, submitting && { opacity: 0.6 }]} onPress={handleCreateSlot} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Create Slot</Text>}
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
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  classSelector: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  classPicker: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 12 },
  classPickerText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  sectionRow: { gap: 8, paddingBottom: 4 },
  sectionChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  sectionChipActive: { backgroundColor: '#e35336' },
  sectionChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  sectionChipTextActive: { color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FEE2E2' },
  actionBtnDanger: { backgroundColor: '#FEF2F2' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#e35336' },
  gridScroll: { flex: 1 },
  gridContent: { padding: 12 },
  gridRow: { flexDirection: 'row' },
  periodHeader: { width: 40, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  periodHeaderText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  dayHeader: { width: 110, justifyContent: 'center', alignItems: 'center', paddingVertical: 8, marginHorizontal: 2, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  dayHeaderText: { fontSize: 12, fontWeight: '700', color: '#374151', textTransform: 'uppercase' },
  periodCell: { width: 40, justifyContent: 'center', alignItems: 'center' },
  periodNum: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  slotCell: { width: 110, minHeight: 80, marginHorizontal: 2, marginVertical: 2, borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  emptySlot: { backgroundColor: '#FFFFFF' },
  slotContent: { gap: 2 },
  slotSubject: { fontSize: 12, fontWeight: '700', color: '#111827' },
  slotTeacher: { fontSize: 10, color: '#6B7280' },
  slotSection: { fontSize: 9, color: '#9CA3AF' },
  slotRoom: { fontSize: 9, color: '#9CA3AF' },
  loadingRow: { paddingVertical: 60, alignItems: 'center' },
  emptyGrid: { paddingVertical: 60, alignItems: 'center', gap: 8, width: 550 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 12, backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  dayPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  dayOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  dayOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  dayOptionText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  dayOptionTextActive: { color: '#e35336' },
  periodPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  periodOption: { width: 40, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  periodOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  periodOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  periodOptionTextActive: { color: '#e35336' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  pickerChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerChipActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerChipText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  pickerChipTextActive: { color: '#e35336' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  classOption: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  classOptionActive: { backgroundColor: '#FEE2E2' },
  classOptionText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  classOptionTextActive: { color: '#e35336' },
});
