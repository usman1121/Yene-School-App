import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { parentGradesAPI } from '@/lib/api/parent';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { SubjectGrade } from '@/types';

export default function ChildGradesScreen() {
  const { childId } = useLocalSearchParams();
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = useCallback(async () => {
    try {
      const [gradesRes, reportCardsRes] = await Promise.allSettled([
        parentGradesAPI.getChildGrades(childId as string),
        parentGradesAPI.getPublishedReportCards(childId as string),
      ]);
      const gradesData = gradesRes.status === 'fulfilled' ? unwrapArray<SubjectGrade>(gradesRes.value) : [];
      const publishedCards = reportCardsRes.status === 'fulfilled' ? unwrapArray<any>(reportCardsRes.value) : [];
      if (gradesData.length > 0) {
        setGrades(gradesData);
      } else if (publishedCards[0]?.subjects) {
        setGrades(
          publishedCards[0].subjects.map((subject: any, index: number) => ({
            id: subject.id || `${subject.name}-${index}`,
            subject: { id: subject.subjectId || `${index}`, name: subject.subjectName || subject.name || 'Subject' },
            class: { id: '', name: publishedCards[0].className || '' },
            section: { id: '', name: publishedCards[0].section || '' },
            term: { id: '', name: publishedCards[0].term || '' },
            caScore: subject.caScore ?? null,
            midScore: subject.midScore ?? null,
            finalScore: subject.finalScore ?? null,
            totalScore: subject.totalScore ?? subject.score ?? null,
            gradeLetter: subject.gradeLetter || subject.grade || null,
            gradePoint: null,
            remark: subject.remark || null,
          }))
        );
      } else {
        setGrades([]);
      }
    } catch (error) {
      console.error('Failed to fetch grades:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

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

  const averageScore = grades.length > 0
    ? Math.round(
        grades
          .filter((g) => g.totalScore !== null)
          .reduce((sum, g) => sum + (g.totalScore || 0), 0) /
          grades.filter((g) => g.totalScore !== null).length
      )
    : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Average */}
      {grades.length > 0 && (
        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Average Score</Text>
          <Text style={styles.averageValue}>{averageScore}%</Text>
          <View style={styles.averageBar}>
            <View style={[styles.averageBarFill, { width: `${averageScore}%` }]} />
          </View>
        </View>
      )}

      {/* Grades List */}
      <FlatList
        data={grades}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const gradeColor = getGradeColor(item.gradeLetter);
          return (
            <View style={styles.gradeCard}>
              <View style={styles.gradeSubject}>
                <Text style={styles.subjectName}>{item.subject?.name || 'Subject'}</Text>
                <Text style={styles.subjectClass}>
                  {item.class?.name} · {item.section?.name}
                </Text>
              </View>
              <View style={styles.gradeScores}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>CA</Text>
                  <Text style={styles.scoreValue}>{item.caScore ?? '-'}</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Mid</Text>
                  <Text style={styles.scoreValue}>{item.midScore ?? '-'}</Text>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreLabel}>Final</Text>
                  <Text style={styles.scoreValue}>{item.finalScore ?? '-'}</Text>
                </View>
              </View>
              <View style={styles.gradeTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{item.totalScore ?? '-'}</Text>
                <View style={[styles.gradeBadge, { backgroundColor: gradeColor.bg }]}>
                  <Text style={[styles.gradeText, { color: gradeColor.text }]}>
                    {item.gradeLetter || '-'}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No grades available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  averageCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  averageBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  averageBarFill: {
    height: '100%',
    backgroundColor: '#e35336',
    borderRadius: 4,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  gradeSubject: {
    marginBottom: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subjectClass: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  gradeScores: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  gradeTotal: {
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
    fontSize: 14,
    fontWeight: 'bold',
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
});
