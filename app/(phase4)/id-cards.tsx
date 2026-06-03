import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

interface IDCardStudent {
  id: string;
  studentId: string;
  name: string;
  className?: string;
  sectionName?: string;
  grade?: string;
  photoUrl?: string;
  studentCode?: string;
}

interface IDCardTemplate {
  id?: string;
  schoolName?: string;
  logoUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  showPhoto?: boolean;
  showCode?: boolean;
  layout?: string;
  watermarkUrl?: string;
}

type TabType = 'generate' | 'template';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any => {
  return res?.data?.data ?? res?.data ?? res ?? null;
};

export default function IDCardsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [students, setStudents] = useState<IDCardStudent[]>([]);
  const [template, setTemplate] = useState<IDCardTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState<IDCardTemplate>({
    schoolName: '',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    showPhoto: true,
    showCode: true,
    layout: 'PORTRAIT',
  });
  const [classFilter, setClassFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const fetchStudents = useCallback(async () => {
    try {
      const params: any = {};
      if (classFilter) params.className = classFilter;
      if (gradeFilter) params.grade = gradeFilter;
      const res = await api.get('/students/id-cards', { params });
      setStudents(extractList(res) as IDCardStudent[]);
    } catch (error) {
      console.error('Failed to fetch ID card students:', error);
    } finally {
      setLoading(false);
    }
  }, [classFilter, gradeFilter]);

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await api.get('/students/id-cards/template');
      const data = extractData(res) as IDCardTemplate | null;
      if (data) {
        setTemplate(data);
        setTemplateForm(data);
      }
    } catch { }
  }, []);

  useEffect(() => {
    if (activeTab === 'generate') {
      fetchStudents();
    } else {
      fetchTemplate();
      setLoading(false);
    }
  }, [activeTab, fetchStudents, fetchTemplate]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'generate') {
      await fetchStudents();
    } else {
      await fetchTemplate();
    }
    setRefreshing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const generateIndividual = async (studentId: string) => {
    try {
      const res = await api.get(`/students/id-cards/${studentId}/pdf`, { responseType: 'blob' as any });
      Alert.alert('Success', 'ID card PDF downloaded');
    } catch {
      Alert.alert('Error', 'Failed to generate ID card');
    }
  };

  const generateBulk = async () => {
    if (selectedIds.size === 0) {
      Alert.alert('Selection Required', 'Please select at least one student');
      return;
    }
    setGenerating(true);
    try {
      await api.post('/students/id-cards/bulk-pdf', { studentIds: Array.from(selectedIds) });
      Alert.alert('Success', `Generating ${selectedIds.size} ID cards`);
    } catch {
      Alert.alert('Error', 'Failed to generate bulk ID cards');
    } finally {
      setGenerating(false);
    }
  };

  const saveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await api.put('/students/id-cards/template', templateForm);
      setTemplate(templateForm);
      setTemplateModal(false);
      Alert.alert('Success', 'Template saved');
    } catch {
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const uploadWatermark = async () => {
    try {
      const formData = new FormData();
      formData.append('watermark', {
        uri: 'file:///path/to/watermark.png',
        type: 'image/png',
        name: 'watermark.png',
      } as any);
      await api.post('/students/id-cards/template/watermark', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Watermark uploaded');
      fetchTemplate();
    } catch {
      Alert.alert('Error', 'Failed to upload watermark');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ID Cards</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, activeTab === 'generate' && styles.activeTab]} onPress={() => { setActiveTab('generate'); setLoading(true); }}>
          <Ionicons name="card-outline" size={16} color={activeTab === 'generate' ? '#e35336' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'generate' && styles.activeTabText]}>Generate Cards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'template' && styles.activeTab]} onPress={() => { setActiveTab('template'); setLoading(true); }}>
          <Ionicons name="settings-outline" size={16} color={activeTab === 'template' ? '#e35336' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'template' && styles.activeTabText]}>Template Settings</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'generate' && (
        <View style={styles.filterRow}>
          <TextInput style={styles.filterInput} placeholder="Filter by class" value={classFilter} onChangeText={setClassFilter} placeholderTextColor="#9CA3AF" />
          <TextInput style={styles.filterInput} placeholder="Filter by grade" value={gradeFilter} onChangeText={setGradeFilter} placeholderTextColor="#9CA3AF" />
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : activeTab === 'generate' ? (
          <>
            {students.length > 0 && (
              <View style={styles.bulkBar}>
                <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
                  <Ionicons name={selectedIds.size === students.length ? 'checkbox' : 'square-outline'} size={18} color="#e35336" />
                  <Text style={styles.selectAllText}>{selectedIds.size === students.length ? 'Deselect All' : 'Select All'}</Text>
                </TouchableOpacity>
                <Text style={styles.selectedCount}>{selectedIds.size} selected</Text>
                <TouchableOpacity style={[styles.bulkGenerateBtn, generating && { opacity: 0.6 }]} onPress={generateBulk} disabled={generating || selectedIds.size === 0}>
                  {generating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.bulkGenerateText}>Generate ZIP</Text>}
                </TouchableOpacity>
              </View>
            )}
            {students.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No students found</Text>
              </View>
            ) : (
              students.map((student) => {
                const isSelected = selectedIds.has(student.id);
                return (
                  <TouchableOpacity key={student.id} style={[styles.studentCard, isSelected && styles.studentCardSelected]} onPress={() => toggleSelect(student.id)} activeOpacity={0.7}>
                    <View style={styles.checkbox}>
                      <Ionicons name={isSelected ? 'checkbox' : 'square-outline'} size={22} color={isSelected ? '#e35336' : '#D1D5DB'} />
                    </View>
                    <View style={styles.studentAvatar}>
                      <Ionicons name="person" size={20} color="#e35336" />
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{student.name}</Text>
                      <Text style={styles.studentDetail}>{student.className}{student.sectionName ? ` - ${student.sectionName}` : ''}{student.grade ? ` | Grade ${student.grade}` : ''}</Text>
                      {student.studentCode && <Text style={styles.studentCode}>{student.studentCode}</Text>}
                    </View>
                    <TouchableOpacity style={styles.generateOneBtn} onPress={() => generateIndividual(student.studentId || student.id)}>
                      <Ionicons name="download-outline" size={18} color="#e35336" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        ) : (
          <>
            <View style={styles.templateCard}>
              <Text style={styles.templateSectionTitle}>Current Template</Text>
              {template ? (
                <View style={styles.templatePreview}>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>School Name:</Text>
                    <Text style={styles.templateValue}>{template.schoolName || 'Not set'}</Text>
                  </View>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Background:</Text>
                    <View style={styles.templateColorRow}>
                      <View style={[styles.colorSwatch, { backgroundColor: template.backgroundColor || '#FFFFFF' }]} />
                      <Text style={styles.templateValue}>{template.backgroundColor}</Text>
                    </View>
                  </View>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Text Color:</Text>
                    <View style={styles.templateColorRow}>
                      <View style={[styles.colorSwatch, { backgroundColor: template.textColor || '#111827' }]} />
                      <Text style={styles.templateValue}>{template.textColor}</Text>
                    </View>
                  </View>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Show Photo:</Text>
                    <Text style={styles.templateValue}>{template.showPhoto ? 'Yes' : 'No'}</Text>
                  </View>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Show Code:</Text>
                    <Text style={styles.templateValue}>{template.showCode ? 'Yes' : 'No'}</Text>
                  </View>
                  <View style={styles.templateRow}>
                    <Text style={styles.templateLabel}>Layout:</Text>
                    <Text style={styles.templateValue}>{template.layout}</Text>
                  </View>
                  {template.watermarkUrl && (
                    <View style={styles.templateRow}>
                      <Text style={styles.templateLabel}>Watermark:</Text>
                      <Text style={styles.templateValue}>Uploaded</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noTemplate}>No template configured yet</Text>
              )}
              <TouchableOpacity style={styles.editTemplateBtn} onPress={() => setTemplateModal(true)}>
                <Ionicons name="create-outline" size={18} color="#FFFFFF" />
                <Text style={styles.editTemplateBtnText}>Edit Template</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.watermarkBtn} onPress={uploadWatermark}>
                <Ionicons name="image-outline" size={18} color="#e35336" />
                <Text style={styles.watermarkBtnText}>Upload Watermark</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={templateModal} animationType="slide" transparent onRequestClose={() => setTemplateModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Template</Text>

              <Text style={styles.modalLabel}>School Name</Text>
              <TextInput style={styles.input} placeholder="School Name" value={templateForm.schoolName} onChangeText={(v) => setTemplateForm({ ...templateForm, schoolName: v })} placeholderTextColor="#9CA3AF" />

              <Text style={styles.modalLabel}>Background Color</Text>
              <TextInput style={styles.input} placeholder="#FFFFFF" value={templateForm.backgroundColor} onChangeText={(v) => setTemplateForm({ ...templateForm, backgroundColor: v })} placeholderTextColor="#9CA3AF" />

              <Text style={styles.modalLabel}>Text Color</Text>
              <TextInput style={styles.input} placeholder="#111827" value={templateForm.textColor} onChangeText={(v) => setTemplateForm({ ...templateForm, textColor: v })} placeholderTextColor="#9CA3AF" />

              <Text style={styles.modalLabel}>Layout</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={[styles.pickerOption, templateForm.layout === 'PORTRAIT' && styles.pickerOptionActive]} onPress={() => setTemplateForm({ ...templateForm, layout: 'PORTRAIT' })}>
                  <Text style={[styles.pickerOptionText, templateForm.layout === 'PORTRAIT' && styles.pickerOptionTextActive]}>Portrait</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pickerOption, templateForm.layout === 'LANDSCAPE' && styles.pickerOptionActive]} onPress={() => setTemplateForm({ ...templateForm, layout: 'LANDSCAPE' })}>
                  <Text style={[styles.pickerOptionText, templateForm.layout === 'LANDSCAPE' && styles.pickerOptionTextActive]}>Landscape</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.switchRow} onPress={() => setTemplateForm({ ...templateForm, showPhoto: !templateForm.showPhoto })}>
                <Ionicons name={templateForm.showPhoto ? 'checkbox' : 'square-outline'} size={22} color="#e35336" />
                <Text style={styles.switchLabel}>Show Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.switchRow} onPress={() => setTemplateForm({ ...templateForm, showCode: !templateForm.showCode })}>
                <Ionicons name={templateForm.showCode ? 'checkbox' : 'square-outline'} size={22} color="#e35336" />
                <Text style={styles.switchLabel}>Show Student Code</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setTemplateModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, savingTemplate && { opacity: 0.6 }]} onPress={saveTemplate} disabled={savingTemplate}>
                  {savingTemplate ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save Template</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#FEE2E2' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#e35336' },
  filterRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterInput: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#111827', backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 16, gap: 12 },
  bulkBar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectAllText: { fontSize: 13, fontWeight: '600', color: '#e35336' },
  selectedCount: { fontSize: 13, color: '#6B7280', flex: 1 },
  bulkGenerateBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#e35336' },
  bulkGenerateText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  studentCardSelected: { borderColor: '#e35336', backgroundColor: '#FFF5F2' },
  checkbox: { width: 24, alignItems: 'center' },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  studentDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  studentCode: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  generateOneBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  templateCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 },
  templateSectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  templatePreview: { gap: 10 },
  templateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  templateLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', width: 100 },
  templateValue: { fontSize: 13, color: '#374151', flex: 1 },
  templateColorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  colorSwatch: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  noTemplate: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 20 },
  editTemplateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336' },
  editTemplateBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  watermarkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e35336' },
  watermarkBtnText: { fontSize: 14, fontWeight: '600', color: '#e35336' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  pickerRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pickerOption: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  switchLabel: { fontSize: 15, color: '#374151' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
