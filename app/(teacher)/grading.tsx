import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { academicAPI, gradingAPI } from '@/lib/api/teacher';
import { normalizeAssignments, unwrapArray, unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { TeacherAssignment, StudentGrade } from '@/types';

interface AssessmentColumn {
  code: string;
  label: string;
  maxScore: number;
}

export default function TeacherGradingScreen() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedClassSectionId, setSelectedClassSectionId] = useState<string>('');
  const [students, setStudents] = useState<StudentGrade[]>([]);
  const [academicYearId, setAcademicYearId] = useState('');
  const [termId, setTermId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const assessmentColumns: AssessmentColumn[] = [
    { code: 'CA', label: 'Quiz', maxScore: 15 },
    { code: 'MID', label: 'Mid Exam', maxScore: 20 },
    { code: 'FINAL', label: 'Final Exam', maxScore: 30 },
  ];

  const fetchAssignments = useCallback(async () => {
    try {
      const [yearRes, termRes] = await Promise.allSettled([
        academicAPI.getActiveYear(),
        academicAPI.getCurrentTerm(),
      ]);
      const year = yearRes.status === 'fulfilled' ? unwrapData<any>(yearRes.value, null) : null;
      const term = termRes.status === 'fulfilled' ? unwrapData<any>(termRes.value, null) : null;
      const nextAcademicYearId = year?.id || '';
      const nextTermId = term?.id || '';
      setAcademicYearId(nextAcademicYearId);
      setTermId(nextTermId);

      const res = await gradingAPI.getTeacherAssignments(nextAcademicYearId ? { academicYear: nextAcademicYearId } : undefined);
      const data = normalizeAssignments(res);
      const filtered = data.filter((a: any) => !a.isHomeroom && a.type !== 'homeroom');
      setAssignments(filtered);

      if (filtered.length > 0) {
        setSelectedSubjectId(filtered[0].subject.id);
        setSelectedClassSectionId(filtered[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedClassSectionId) return;
    setLoading(true);
    try {
      const assignment = assignments.find((a) => a.id === selectedClassSectionId);
      if (!assignment) return;

      const res = await gradingAPI.getTeacherStudents({
        academicYear: academicYearId,
        termId,
        classId: assignment.class.id,
        sectionId: assignment.section.id,
        subjectId: assignment.subject.id,
      });

      const root = unwrapData<any>(res, {});
      const data = root?.students || unwrapArray(res);
      const studentData = data.map((s: any) => ({
        studentId: s.studentId || s.id,
        studentName: s.studentName || s.name || 'Unknown',
        rollNumber: s.rollNumber || '',
        caScore: s.caScore ?? null,
        midScore: s.midScore ?? null,
        finalScore: s.finalScore ?? null,
        totalScore: s.totalScore ?? null,
        gradeLetter: s.gradeLetter ?? null,
        remark: s.remark ?? null,
        status: s.status || 'DRAFT',
        componentScores: Array.isArray(s.componentScores)
          ? Object.fromEntries(s.componentScores.map((item: any) => [String(item.code).toUpperCase(), item.score ?? null]))
          : s.componentScores || {},
      }));
      setStudents(studentData);
      setHasChanges(false);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClassSectionId, assignments, academicYearId, termId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  useEffect(() => {
    if (selectedClassSectionId && assignments.length > 0) {
      fetchStudents();
    }
  }, [selectedClassSectionId, fetchStudents, assignments.length]);

  const calculateTotal = (componentScores: Record<string, number | null> | undefined) => {
    if (!componentScores) return null;
    const values = Object.values(componentScores).filter((v) => v !== null) as number[];
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, v) => sum + v, 0) * 100) / 100;
  };

  const calculateGrade = (total: number | null) => {
    if (total === null) return '';
    if (total >= 90) return 'A';
    if (total >= 80) return 'B';
    if (total >= 70) return 'C';
    if (total >= 60) return 'D';
    return 'F';
  };

  const handleScoreChange = (studentId: string, code: string, value: string) => {
    const col = assessmentColumns.find((c) => c.code === code);
    const maxScore = col?.maxScore || 100;
    let numValue = value === '' ? null : parseFloat(value);

    if (numValue !== null && (isNaN(numValue) || numValue < 0)) numValue = 0;
    if (numValue !== null && numValue > maxScore) {
      Alert.alert('Error', `${col?.label} max score is ${maxScore}`);
      numValue = maxScore;
    }

    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const newScores = { ...(s.componentScores || {}), [code]: numValue };
        const total = calculateTotal(newScores);
        return {
          ...s,
          componentScores: newScores,
          totalScore: total,
          gradeLetter: total !== null ? calculateGrade(total) : null,
        };
      })
    );
    setHasChanges(true);
  };

  const handleSaveDraft = async () => {
    const gradesToSave = students
      .filter((s) => {
        const scores = Object.values(s.componentScores || {});
        return scores.some((v) => v !== null && v !== undefined);
      })
      .map((s) => {
        const assignment = assignments.find((a) => a.id === selectedClassSectionId);
        return {
          studentId: s.studentId,
          subjectId: assignment?.subject.id,
          classId: assignment?.class.id,
          sectionId: assignment?.section.id,
          academicYear: academicYearId,
          termId,
          caScore: s.caScore,
          midScore: s.midScore,
          finalScore: s.finalScore,
          componentScores: assessmentColumns.map((col) => ({
            code: col.code,
            score: s.componentScores?.[col.code.toUpperCase()] ?? null,
          })),
          remark: s.remark,
        };
      });

    if (gradesToSave.length === 0) {
      Alert.alert('Error', 'No grades to save');
      return;
    }

    setSaving(true);
    try {
      await gradingAPI.bulkEnterGrades({ grades: gradesToSave });
      Alert.alert('Success', 'Grades saved successfully');
      setHasChanges(false);
      fetchStudents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    const assignment = assignments.find((a) => a.id === selectedClassSectionId);
    if (!assignment) return;

    setSaving(true);
    try {
      await gradingAPI.submitAllGrades({
        academicYear: academicYearId,
        termId,
        classId: assignment.class.id,
        sectionId: assignment.section.id,
        subjectId: assignment.subject.id,
      });
      Alert.alert('Success', 'Grades submitted to registrar');
      fetchStudents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to submit grades');
    } finally {
      setSaving(false);
    }
  };

  const getGradeColor = (grade: string | null) => {
    switch (grade) {
      case 'A': return { bg: '#D1FAE5', text: '#065F46' };
      case 'B': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'C': return { bg: '#FEF3C7', text: '#92400E' };
      case 'D': return { bg: '#FED7AA', text: '#9A3412' };
      case 'F': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const subjectOptions = assignments.reduce((acc, a) => {
    if (!acc.find((s) => s.id === a.subject.id)) {
      acc.push({ id: a.subject.id, name: a.subject.name });
    }
    return acc;
  }, [] as Array<{ id: string; name: string }>);

  const classOptions = selectedSubjectId
    ? assignments.filter((a) => a.subject.id === selectedSubjectId)
    : assignments;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marks Entry</Text>
        <Text style={styles.headerSubtext}>Enter and manage student marks</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Subject</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {subjectOptions.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.filterChip,
                  selectedSubjectId === sub.id && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedSubjectId(sub.id);
                  setSelectedClassSectionId('');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedSubjectId === sub.id && styles.filterChipTextActive,
                  ]}
                >
                  {sub.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Class - Section</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {classOptions.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[
                  styles.filterChip,
                  selectedClassSectionId === cls.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedClassSectionId(cls.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedClassSectionId === cls.id && styles.filterChipTextActive,
                  ]}
                >
                  {cls.class.name} - {cls.section.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Students */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e35336" />
        </View>
      ) : (
        <ScrollView style={styles.studentList}>
          {students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          ) : (
            students.map((student, index) => (
              <View key={student.studentId} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <Text style={styles.studentIndex}>{index + 1}.</Text>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.studentName}</Text>
                    <Text style={styles.studentRoll}>Roll: {student.rollNumber || '-'}</Text>
                  </View>
                  <View style={[styles.statusBadge, student.status === 'SUBMITTED' ? styles.submittedBadge : styles.draftBadge]}>
                    <Text style={[styles.statusText, student.status === 'SUBMITTED' ? styles.submittedText : styles.draftText]}>
                      {student.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.scoresGrid}>
                  {assessmentColumns.map((col) => (
                    <View key={col.code} style={styles.scoreInput}>
                      <Text style={styles.scoreLabel}>{col.label}</Text>
                      <Text style={styles.scoreMax}>Max: {col.maxScore}</Text>
                      <TextInput
                        style={styles.scoreField}
                        keyboardType="numeric"
                        value={student.componentScores?.[col.code]?.toString() ?? ''}
                        onChangeText={(val) => handleScoreChange(student.studentId, col.code, val)}
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalValue}>{student.totalScore ?? '-'}</Text>
                  <View style={[styles.gradeBadge, { backgroundColor: getGradeColor(student.gradeLetter).bg }]}>
                    <Text style={[styles.gradeText, { color: getGradeColor(student.gradeLetter).text }]}>
                      {student.gradeLetter || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Action Bar */}
      {students.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveDraft}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Draft</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e35336',
    borderColor: '#e35336',
  },
  filterChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  studentList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  studentRoll: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  draftBadge: {
    backgroundColor: '#F3F4F6',
  },
  submittedBadge: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  draftText: {
    color: '#6B7280',
  },
  submittedText: {
    color: '#1D4ED8',
  },
  scoresGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  scoreInput: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  scoreMax: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  scoreField: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingVertical: 12,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e35336',
    borderRadius: 8,
    paddingVertical: 12,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
