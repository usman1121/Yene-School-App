import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { adminAcademicYearsApi } from '@/api';
import { Ionicons } from '@expo/vector-icons';
import type { AcademicYear, Term } from '@/types';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const CURRICULUM_TYPES = ['ETHIOPIAN', 'WESTERN', 'IB'] as const;

export default function AdminAcademicYearsScreen() {
  const insets = useSafeAreaInsets();
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Record<string, Term[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTermModal, setShowTermModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createCurriculum, setCreateCurriculum] = useState('ETHIOPIAN');

  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editCurriculum, setEditCurriculum] = useState('');

  const [termName, setTermName] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [termWeight, setTermWeight] = useState('');

  const [periodWeights, setPeriodWeights] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminAcademicYearsApi.getAcademicYears();
      const data = extractList(res) as AcademicYear[];
      setYears(data);
      const termsMap: Record<string, Term[]> = {};
      await Promise.all(data.map(async (yr) => {
        try {
          const tRes = await adminAcademicYearsApi.getTerms(yr.id);
          termsMap[yr.id] = extractList(tRes) as Term[];
        } catch { termsMap[yr.id] = []; }
      }));
      setTerms(termsMap);
    } catch (error) {
      console.error('Failed to fetch academic years:', error);
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

  const toggleExpand = (yearId: string) => {
    setExpandedYear(expandedYear === yearId ? null : yearId);
  };

  const handleCreate = async () => {
    if (!createName || !createStart || !createEnd) {
      Alert.alert('Validation', 'Name, start date, and end date are required');
      return;
    }
    setSubmitting(true);
    try {
      await adminAcademicYearsApi.createAcademicYear({
        name: createName,
        startDate: createStart,
        endDate: createEnd,
        curriculumType: createCurriculum,
      });
      Alert.alert('Success', 'Academic year created');
      setShowCreateModal(false);
      setCreateName('');
      setCreateStart('');
      setCreateEnd('');
      setCreateCurriculum('ETHIOPIAN');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create academic year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedYear) return;
    setSubmitting(true);
    try {
      const data: any = {};
      if (editName) data.name = editName;
      if (editStart) data.startDate = editStart;
      if (editEnd) data.endDate = editEnd;
      if (editCurriculum) data.curriculumType = editCurriculum;
      await adminAcademicYearsApi.updateAcademicYear(selectedYear.id, data);
      Alert.alert('Success', 'Academic year updated');
      setShowEditModal(false);
      setSelectedYear(null);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update academic year');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (year: AcademicYear) => {
    Alert.alert(
      'Delete Academic Year',
      `Are you sure you want to delete ${year.name}? All associated terms will also be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminAcademicYearsApi.deleteAcademicYear(year.id);
              Alert.alert('Success', 'Academic year deleted');
              setShowEditModal(false);
              setSelectedYear(null);
              fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to delete academic year');
            }
          },
        },
      ]
    );
  };

  const handleActivate = async (yearId: string) => {
    try {
      await adminAcademicYearsApi.activateAcademicYear(yearId);
      Alert.alert('Success', 'Academic year activated');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to activate');
    }
  };

  const handleCreateTerm = async () => {
    if (!selectedYear || !termName || !termStart || !termEnd || !termWeight) {
      Alert.alert('Validation', 'All term fields are required');
      return;
    }
    const weight = parseInt(termWeight, 10);
    if (isNaN(weight)) {
      Alert.alert('Validation', 'Weight must be a number');
      return;
    }
    setSubmitting(true);
    try {
      await adminAcademicYearsApi.createTerm(selectedYear.id, {
        name: termName,
        startDate: termStart,
        endDate: termEnd,
        percentageWeight: weight,
      });
      Alert.alert('Success', 'Term created');
      setShowTermModal(false);
      setTermName('');
      setTermStart('');
      setTermEnd('');
      setTermWeight('');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to create term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockTerm = async (term: Term) => {
    try {
      await adminAcademicYearsApi.lockTerm(term.id, !term.isLocked);
      Alert.alert('Success', term.isLocked ? 'Term unlocked' : 'Term locked');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to update term');
    }
  };

  const handleViewWeights = async (yearId: string) => {
    try {
      const res = await adminAcademicYearsApi.getPeriodWeights(yearId);
      const w = res?.data?.data || res?.data || res;
      setPeriodWeights(w);
      Alert.alert('Period Weights', JSON.stringify(w, null, 2));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Failed to fetch weights');
    }
  };

  const handleValidateWeights = async (yearId: string) => {
    try {
      const res = await adminAcademicYearsApi.validatePeriodWeights(yearId);
      const v = res?.data?.data || res?.data || res;
      setValidationResult(v);
      Alert.alert('Validation Result', JSON.stringify(v, null, 2));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || err?.message || 'Validation failed');
    }
  };

  const openEditModal = (year: AcademicYear) => {
    setSelectedYear(year);
    setEditName(year.name);
    setEditStart(year.startDate || '');
    setEditEnd(year.endDate || '');
    setEditCurriculum(year.curriculumType || '');
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
        <Text style={styles.headerTitle}>Academic Years</Text>
        <Text style={styles.headerSubtext}>{years.length} year(s)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {years.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No academic years</Text>
          </View>
        ) : (
          years.map((year) => (
            <View key={year.id} style={styles.yearCard}>
              <TouchableOpacity style={styles.yearHeader} onPress={() => toggleExpand(year.id)}>
                <View style={styles.yearInfo}>
                  <Text style={styles.yearName}>{year.name}</Text>
                  <Text style={styles.yearType}>{year.curriculumType}</Text>
                </View>
                <View style={styles.yearMeta}>
                  {year.isActive && <View style={styles.activeBadge}><Text style={styles.activeText}>Active</Text></View>}
                  <Ionicons name={expandedYear === year.id ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
              {expandedYear === year.id && (
                <View style={styles.termList}>
                  <View style={styles.termActionsRow}>
                    <TouchableOpacity style={styles.termActionBtn} onPress={() => { setSelectedYear(year); setTermName(''); setTermStart(''); setTermEnd(''); setTermWeight(''); setShowTermModal(true); }}>
                      <Ionicons name="add-circle-outline" size={16} color="#e35336" />
                      <Text style={styles.termActionText}>Add Term</Text>
                    </TouchableOpacity>
                    {!year.isActive && (
                      <TouchableOpacity style={styles.termActionBtn} onPress={() => handleActivate(year.id)}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                        <Text style={[styles.termActionText, { color: '#10B981' }]}>Activate</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.termActionBtn} onPress={() => handleViewWeights(year.id)}>
                      <Ionicons name="calculator-outline" size={16} color="#6B7280" />
                      <Text style={[styles.termActionText, { color: '#6B7280' }]}>Weights</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.termActionBtn} onPress={() => handleValidateWeights(year.id)}>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#6B7280" />
                      <Text style={[styles.termActionText, { color: '#6B7280' }]}>Validate</Text>
                    </TouchableOpacity>
                  </View>

                  {(terms[year.id] || []).length > 0 ? (
                    terms[year.id].map((term) => (
                      <View key={term.id} style={styles.termItem}>
                        <View>
                          <Text style={styles.termName}>{term.name}</Text>
                          <Text style={styles.termWeight}>{term.percentageWeight}%</Text>
                        </View>
                        <View style={styles.termItemActions}>
                          <TouchableOpacity
                            style={[styles.lockToggle, term.isLocked && styles.lockToggleActive]}
                            onPress={() => handleLockTerm(term)}
                          >
                            <Ionicons name={term.isLocked ? 'lock-closed' : 'lock-open-outline'} size={14} color={term.isLocked ? '#FFFFFF' : '#6B7280'} />
                            <Text style={[styles.lockText, term.isLocked && styles.lockTextActive]}>{term.isLocked ? 'Locked' : 'Lock'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTerms}>No terms yet</Text>
                  )}

                  <TouchableOpacity style={styles.editYearLink} onPress={() => openEditModal(year)}>
                    <Ionicons name="create-outline" size={14} color="#6B7280" />
                    <Text style={styles.editYearLinkText}>Edit Academic Year</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 20 }]} onPress={() => { setCreateName(''); setCreateStart(''); setCreateEnd(''); setCreateCurriculum('ETHIOPIAN'); setShowCreateModal(true); }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showCreateModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Academic Year</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} placeholder="e.g. 2025-2026" placeholderTextColor="#9CA3AF" value={createName} onChangeText={setCreateName} />

            <Text style={styles.label}>Start Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={createStart} onChangeText={setCreateStart} />

            <Text style={styles.label}>End Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={createEnd} onChangeText={setCreateEnd} />

            <Text style={styles.label}>Curriculum Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.curriculumPicker}>
              {CURRICULUM_TYPES.map((ct) => (
                <TouchableOpacity key={ct} style={[styles.curriculumChip, createCurriculum === ct && styles.curriculumChipActive]} onPress={() => setCreateCurriculum(ct)}>
                  <Text style={[styles.curriculumChipText, createCurriculum === ct && styles.curriculumChipTextActive]}>{ct}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreate} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Academic Year</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Academic Year</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setSelectedYear(null); }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedYear && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} placeholder="Year name" placeholderTextColor="#9CA3AF" value={editName} onChangeText={setEditName} />

                <Text style={styles.label}>Start Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={editStart} onChangeText={setEditStart} />

                <Text style={styles.label}>End Date</Text>
                <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={editEnd} onChangeText={setEditEnd} />

                <Text style={styles.label}>Curriculum Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.curriculumPicker}>
                  {CURRICULUM_TYPES.map((ct) => (
                    <TouchableOpacity key={ct} style={[styles.curriculumChip, editCurriculum === ct && styles.curriculumChipActive]} onPress={() => setEditCurriculum(ct)}>
                      <Text style={[styles.curriculumChipText, editCurriculum === ct && styles.curriculumChipTextActive]}>{ct}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleUpdate} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Save Changes</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(selectedYear)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.deleteText}>Delete Academic Year</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTermModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Term</Text>
              <TouchableOpacity onPress={() => setShowTermModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedYear && <Text style={styles.termForYear}>For: {selectedYear.name}</Text>}

            <Text style={styles.label}>Term Name</Text>
            <TextInput style={styles.input} placeholder="e.g. Term 1" placeholderTextColor="#9CA3AF" value={termName} onChangeText={setTermName} />

            <Text style={styles.label}>Start Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={termStart} onChangeText={setTermStart} />

            <Text style={styles.label}>End Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#9CA3AF" value={termEnd} onChangeText={setTermEnd} />

            <Text style={styles.label}>Percentage Weight</Text>
            <TextInput style={styles.input} placeholder="e.g. 33" placeholderTextColor="#9CA3AF" value={termWeight} onChangeText={setTermWeight} keyboardType="number-pad" />

            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleCreateTerm} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Create Term</Text>}
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
  yearCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, overflow: 'hidden' },
  yearHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  yearInfo: { flex: 1 },
  yearName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  yearType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  yearMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  activeText: { fontSize: 10, fontWeight: '600', color: '#065F46', textTransform: 'uppercase' },
  termList: { borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 14 },
  termItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  termName: { fontSize: 14, color: '#374151' },
  termWeight: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  termItemActions: { flexDirection: 'row', gap: 8 },
  lockToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  lockToggleActive: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  lockText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  lockTextActive: { color: '#EF4444' },
  noTerms: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
  termActionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  termActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  termActionText: { fontSize: 12, color: '#e35336', fontWeight: '500' },
  editYearLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'center' },
  editYearLinkText: { fontSize: 12, color: '#6B7280' },
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
  termForYear: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  curriculumPicker: { marginBottom: 4 },
  curriculumChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  curriculumChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  curriculumChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  curriculumChipTextActive: { color: '#FFFFFF' },
});
