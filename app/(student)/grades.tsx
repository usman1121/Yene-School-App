import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { studentApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { SubjectGrade } from '@/types';

export default function StudentGradesScreen() {
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGrades = useCallback(async () => {
    try {
      const res = await studentApi.getMyGrades();
      setGrades(unwrapArray<SubjectGrade>(res));
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrades(); }, [fetchGrades]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchGrades();
    setRefreshing(false);
  }, [fetchGrades]);

  const avgGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.totalScore || 0), 0) / grades.length)
    : null;

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Grades</Text>
        <Text style={styles.headerSubtext}>Average: {avgGrade !== null ? `${avgGrade}%` : 'N/A'}</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {grades.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No grades available yet</Text>
          </View>
        ) : (
          grades.map((grade) => {
            const gc = getGradeColor(grade.gradeLetter);
            return (
              <View key={`${grade.subject?.id || grade.id}`} style={styles.gradeCard}>
                <View style={styles.gradeHeader}>
                  <Text style={styles.subjectName}>{grade.subject?.name || 'Subject'}</Text>
                  <View style={[styles.gradeBadge, { backgroundColor: gc.bg }]}>
                    <Text style={[styles.gradeText, { color: gc.text }]}>{grade.gradeLetter || '-'}</Text>
                  </View>
                </View>
                <View style={styles.scoreRow}>
                  <ScoreItem label="CA" value={grade.caScore} />
                  <ScoreItem label="Mid" value={grade.midScore} />
                  <ScoreItem label="Final" value={grade.finalScore} />
                  <ScoreItem label="Total" value={grade.totalScore} bold />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function ScoreItem({ label, value, bold }: { label: string; value: number | null; bold?: boolean }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <Text style={[styles.scoreValue, bold && styles.scoreValueBold]}>{value !== null ? value : '-'}</Text>
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
  gradeCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  gradeText: { fontSize: 13, fontWeight: 'bold' },
  scoreRow: { flexDirection: 'row', gap: 8 },
  scoreItem: { flex: 1, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 8, padding: 8 },
  scoreLabel: { fontSize: 11, color: '#6B7280' },
  scoreValue: { fontSize: 16, fontWeight: '600', color: '#374151', marginTop: 2 },
  scoreValueBold: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
});
