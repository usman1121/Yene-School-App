import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/api/student.api';
import { parentGradesAPI } from '@/lib/api/parent';

interface ReportCard {
  id: string;
  studentId: string;
  studentName?: string;
  termId?: string;
  termName?: string;
  academicYearId?: string;
  academicYearName?: string;
  status: 'DRAFT' | 'PUBLISHED';
  percentage?: number;
  grade?: string;
  publishedAt?: string;
  subjects?: { subject: { name: string }; caScore: number | null; midScore: number | null; finalScore: number | null; totalScore: number | null; gradeLetter: string | null }[];
}

export default function ReportCardsScreen() {
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      if (user?.role === 'STUDENT') {
        const res = await studentApi.getMyReportCards();
        const data = res.data?.data || res.data || [];
        setReportCards(Array.isArray(data) ? data : []);
      } else if (user?.role === 'PARENT') {
        // Parent would see all children's report cards - simplified
        setReportCards([]);
      }
    } catch (error) {
      console.error('Failed to load report cards:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Cards</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : reportCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Report Cards</Text>
            <Text style={styles.emptyText}>Report cards will appear here once published by your school.</Text>
          </View>
        ) : (
          reportCards.map((rc) => (
            <View key={rc.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportIcon}>
                  <Ionicons name="document-text" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTerm}>{rc.termName || `Term`}</Text>
                  <Text style={styles.reportYear}>{rc.academicYearName || 'Academic Year'}</Text>
                  {rc.studentName && <Text style={styles.reportStudent}>{rc.studentName}</Text>}
                </View>
                <View style={[styles.statusBadge, rc.status === 'PUBLISHED' ? styles.publishedBadge : styles.draftBadge]}>
                  <Text style={[styles.statusText, rc.status === 'PUBLISHED' ? styles.publishedText : styles.draftText]}>
                    {rc.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                  </Text>
                </View>
              </View>

              {rc.percentage != null && (
                <View style={styles.overallScore}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreValue}>{rc.percentage?.toFixed(0)}%</Text>
                    <Text style={styles.scoreGrade}>{rc.grade}</Text>
                  </View>
                </View>
              )}

              {rc.subjects && rc.subjects.length > 0 && (
                <View style={styles.subjectsSection}>
                  <Text style={styles.subjectsTitle}>Subjects</Text>
                  {rc.subjects.map((s, i) => (
                    <View key={i} style={styles.subjectRow}>
                      <Text style={styles.subjectName}>{s.subject?.name}</Text>
                      <Text style={styles.subjectScore}>{s.totalScore ?? '-'}</Text>
                      {s.gradeLetter && (
                        <View style={styles.subjectGradeBadge}>
                          <Text style={styles.subjectGradeText}>{s.gradeLetter}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {rc.publishedAt && (
                <Text style={styles.publishDate}>Published: {formatDate(rc.publishedAt)}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 16, gap: 12 },
  reportCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  reportHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  reportIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  reportInfo: { flex: 1 },
  reportTerm: { fontSize: 16, fontWeight: '700', color: '#111827' },
  reportYear: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  reportStudent: { fontSize: 13, color: '#374151', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  publishedBadge: { backgroundColor: '#D1FAE5' },
  draftBadge: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 12, fontWeight: '600' },
  publishedText: { color: '#065F46' },
  draftText: { color: '#6B7280' },
  overallScore: { alignItems: 'center', paddingVertical: 8 },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  scoreValue: { fontSize: 20, fontWeight: '700', color: '#e35336' },
  scoreGrade: { fontSize: 12, fontWeight: '600', color: '#C73B1E', marginTop: 1 },
  subjectsSection: { gap: 8 },
  subjectsTitle: { fontSize: 14, fontWeight: '600', color: '#374151' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  subjectName: { flex: 1, fontSize: 14, color: '#374151' },
  subjectScore: { fontSize: 14, fontWeight: '600', color: '#111827', marginRight: 8 },
  subjectGradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#F3F4F6' },
  subjectGradeText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  publishDate: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});
