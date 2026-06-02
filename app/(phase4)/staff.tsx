import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';
import { useAuth } from '@/contexts/AuthContext';

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  subjects?: { id: string; name: string }[];
  avatarUrl?: string;
  isActive?: boolean;
}

interface Assignment {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section: { id: string; name: string };
  type?: string;
  isHomeroom?: boolean;
}

const ROLES = ['ALL', 'TEACHER', 'ADMIN', 'STAFF', 'FINANCE', 'REGISTRAR'];

export default function StaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter !== 'ALL') params.role = roleFilter;
      const res = await api.get('/teachers', { params });
      const data = res.data?.data || res.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeachers();
    setRefreshing(false);
  };

  const handleViewDetails = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDetail(true);
    setAssignLoading(true);
    try {
      const [detailRes, assignRes] = await Promise.all([
        api.get(`/teachers/${teacher.id}`),
        api.get(`/teachers/${teacher.id}/assignments`),
      ]);
      const detailData = detailRes.data?.data || detailRes.data;
      if (detailData) setSelectedTeacher(detailData);
      const assignData = assignRes.data?.data || assignRes.data || [];
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch (error) {
      console.error('Failed to load teacher details:', error);
    } finally {
      setAssignLoading(false);
    }
  };

  const filtered = teachers.filter((t) =>
    !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search staff by name..."
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

      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, roleFilter === r && styles.filterChipActive]}
              onPress={() => setRoleFilter(roleFilter === r ? 'ALL' : r)}
            >
              <Text style={[styles.filterChipText, roleFilter === r && styles.filterChipTextActive]}>{r === 'ALL' ? 'All' : r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
            <Text style={styles.emptyText}>{search ? 'No matching staff' : 'No staff found'}</Text>
          </View>
        ) : (
          filtered.map((teacher) => (
            <TouchableOpacity key={teacher.id} style={styles.staffCard} onPress={() => handleViewDetails(teacher)}>
              <View style={styles.staffRow}>
                <View style={styles.staffAvatar}>
                  <Ionicons name="person-circle" size={22} color="#6B7280" />
                </View>
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName}>{teacher.name}</Text>
                  <Text style={styles.staffEmail}>{teacher.email}</Text>
                  {teacher.role && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleBadgeText}>{teacher.role}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </View>
              {teacher.subjects && teacher.subjects.length > 0 && (
                <View style={styles.subjectRow}>
                  {teacher.subjects.map((sub) => (
                    <View key={sub.id} style={styles.subjectChip}>
                      <Text style={styles.subjectChipText}>{sub.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.detailHeader}>
                <Text style={styles.modalTitle}>Staff Details</Text>
                <TouchableOpacity onPress={() => setShowDetail(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {selectedTeacher && (
                <>
                  <View style={styles.detailAvatarRow}>
                    <View style={styles.detailAvatar}>
                      <Ionicons name="person-circle" size={48} color="#6B7280" />
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailName}>{selectedTeacher.name}</Text>
                      <Text style={styles.detailEmail}>{selectedTeacher.email}</Text>
                      {selectedTeacher.phone && <Text style={styles.detailPhone}>{selectedTeacher.phone}</Text>}
                    </View>
                  </View>

                  {selectedTeacher.role && (
                    <View style={styles.detailRoleRow}>
                      <Text style={styles.detailLabel}>Role</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{selectedTeacher.role}</Text>
                      </View>
                    </View>
                  )}

                  {selectedTeacher.subjects && selectedTeacher.subjects.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Subjects</Text>
                      <View style={styles.subjectRow}>
                        {selectedTeacher.subjects.map((sub) => (
                          <View key={sub.id} style={styles.subjectChip}>
                            <Text style={styles.subjectChipText}>{sub.name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Assignments</Text>
                    {assignLoading ? (
                      <ActivityIndicator size="small" color="#e35336" style={{ marginTop: 12 }} />
                    ) : assignments.length === 0 ? (
                      <Text style={styles.noAssignments}>No assignments found</Text>
                    ) : (
                      assignments.map((a) => (
                        <View key={a.id} style={styles.assignmentCard}>
                          <View style={styles.assignmentTop}>
                            <Text style={styles.assignmentSubject}>{a.subject.name}</Text>
                            {a.isHomeroom && (
                              <View style={styles.homeroomBadge}>
                                <Text style={styles.homeroomBadgeText}>Homeroom</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.assignmentClass}>{a.class.name} — {a.section.name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </>
              )}
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
  searchRow: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#111827' },
  filterRow: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
  filterChipActive: { backgroundColor: '#e35336' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterChipTextActive: { color: '#FFFFFF' },
  scrollContent: { padding: 16, paddingTop: 8, gap: 10 },
  staffCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  staffAvatar: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  staffEmail: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#1E40AF', letterSpacing: 0.3 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  subjectChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  subjectChipText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailAvatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailAvatar: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  detailInfo: { flex: 1 },
  detailName: { fontSize: 17, fontWeight: '700', color: '#111827' },
  detailEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  detailPhone: { fontSize: 13, color: '#9CA3AF', marginTop: 1 },
  detailRoleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  detailLabel: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  detailSection: { marginBottom: 16 },
  noAssignments: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  assignmentCard: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginTop: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  assignmentTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignmentSubject: { fontSize: 14, fontWeight: '600', color: '#111827' },
  homeroomBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  homeroomBadgeText: { fontSize: 9, fontWeight: '700', color: '#92400E', letterSpacing: 0.2 },
  assignmentClass: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
