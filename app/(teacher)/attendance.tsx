import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, teachersAPI } from '@/lib/api/teacher';
import { normalizeAssignments, unwrapArray, unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { TeacherAssignment, StudentAttendance } from '@/types';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED';

export default function TeacherAttendanceScreen() {
  const { user } = useAuth();
  const [classOptions, setClassOptions] = useState<TeacherAssignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const fetchClasses = useCallback(async () => {
    try {
      const res = await teachersAPI.getMyAssignments();
      const assignments = normalizeAssignments(res);
      const filtered = assignments.filter((a: any) => a.isHomeroom || a.type === 'homeroom');
      setClassOptions(filtered);
      if (filtered.length > 0 && !selectedClass) {
        setSelectedClass(filtered[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const assignment = classOptions.find((c) => c.id === selectedClass);
      if (!assignment) return;

      const res = await attendanceAPI.getStudentsForClass(
        assignment.class.id,
        assignment.class.name,
        assignment.section.name,
        selectedDate,
        assignment.section.id,
      );

      const rawStudents = unwrapArray(res);
      const attendanceStudents: StudentAttendance[] = rawStudents.map((s: any) => ({
        id: s.userId || s.id,
        rollNumber: s.rollNumber || 'N/A',
        name: s.user?.name || s.name || 'Unknown',
        gender: s.gender || 'MALE',
        avatarUrl: s.avatarUrl,
        status: 'UNMARKED' as AttendanceStatus,
        remark: '',
      }));
      setStudents(attendanceStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, classOptions, selectedDate]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass && classOptions.length > 0) {
      fetchStudents();
    }
  }, [selectedClass, fetchStudents, classOptions.length]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'PRESENT' as AttendanceStatus })));
    setHasChanges(true);
  };

  const handleSave = async () => {
    const unmarked = students.filter((s) => s.status === 'UNMARKED').length;
    if (unmarked > 0) {
      Alert.alert('Error', `Please mark all students. ${unmarked} still unmarked.`);
      return;
    }

    setSaving(true);
    try {
      const assignment = classOptions.find((c) => c.id === selectedClass);
      if (!assignment) return;

      const slotId = assignment.timetableSlotId || assignment.id;
      const sessionRes = await attendanceAPI.openSession(slotId, selectedDate);
      const sessionId = unwrapData<any>(sessionRes, sessionRes.data).id;

      const records = students.map((s) => ({
        studentId: s.id,
        status: s.status,
        remark: s.remark || '',
      }));

      await attendanceAPI.markAttendance(sessionId, { records });
      await attendanceAPI.submitSession(sessionId);

      Alert.alert('Success', 'Attendance saved and submitted!');
      setHasChanges(false);
      fetchStudents();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedClassData = classOptions.find((c) => c.id === selectedClass);
  const classLabel = selectedClassData
    ? `${selectedClassData.class.name} - Section ${selectedClassData.section.name}`
    : 'No Class Selected';

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Attendance</Text>
          <Text style={styles.headerSubtext}>Mark and monitor daily student attendance</Text>
        </View>
      </View>

      {/* Class Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classSelector}>
        {classOptions.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={[
              styles.classChip,
              selectedClass === cls.id && styles.classChipActive,
            ]}
            onPress={() => setSelectedClass(cls.id)}
          >
            <Text
              style={[
                styles.classChipText,
                selectedClass === cls.id && styles.classChipTextActive,
              ]}
            >
              {cls.class.name} - {cls.section.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats Bar */}
      {students.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{presentCount}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{lateCount}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{students.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search students..."
          placeholderTextColor="#9CA3AF"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Student List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e35336" />
        </View>
      ) : (
        <ScrollView
          style={styles.studentList}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchStudents}
              colors={['#e35336']}
            />
          }
        >
          {filteredStudents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No students found</Text>
            </View>
          ) : (
            filteredStudents.map((student) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {student.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.name}</Text>
                    <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
                  </View>
                </View>

                <View style={styles.statusPills}>
                  {(['PRESENT', 'ABSENT', 'LATE'] as AttendanceStatus[]).map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusPill,
                        student.status === status && styles.statusPillActive,
                        student.status === 'PRESENT' && student.status === status && styles.presentPill,
                        student.status === 'ABSENT' && student.status === status && styles.absentPill,
                        student.status === 'LATE' && student.status === status && styles.latePill,
                      ]}
                      onPress={() => handleStatusChange(student.id, status)}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          student.status === status && styles.statusPillTextActive,
                        ]}
                      >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Action Bar */}
      {students.length > 0 && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllPresent}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#374151" />
            <Text style={styles.markAllText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, (!hasChanges || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Attendance</Text>
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
  classSelector: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  classChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  classChipActive: {
    backgroundColor: '#e35336',
    borderColor: '#e35336',
  },
  classChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  classChipTextActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
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
    marginBottom: 10,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e35336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  statusPills: {
    flexDirection: 'row',
    gap: 8,
  },
  statusPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  statusPillActive: {
    borderWidth: 0,
  },
  presentPill: {
    backgroundColor: '#e35336',
  },
  absentPill: {
    backgroundColor: '#EF4444',
  },
  latePill: {
    backgroundColor: '#F59E0B',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusPillTextActive: {
    color: '#FFFFFF',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  markAllText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e35336',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
