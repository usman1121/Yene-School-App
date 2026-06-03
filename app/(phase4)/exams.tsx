import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ScreenContainer } from '@/components/ui';
import { studentApi } from '@/api/student.api';

interface Exam {
  id: string;
  title: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  section?: { id: string; name: string };
  date: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  maxScore: number;
  room?: string;
}

interface AssessmentResult {
  id: string;
  subject: { id: string; name: string };
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  status: string;
  date: string;
}

export default function ExamsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'results'>('upcoming');
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      if (user?.role === 'STUDENT') {
        const [examsRes, resultsRes] = await Promise.all([
          studentApi.getUpcomingExams().catch(() => ({ data: [] })),
          studentApi.getAssessmentResults().catch(() => ({ data: [] })),
        ]);
        setExams(Array.isArray(examsRes.data) ? examsRes.data : examsRes.data?.data || []);
        setResults(Array.isArray(resultsRes.data) ? resultsRes.data : resultsRes.data?.data || []);
      }
    } catch (error) {
      console.error('Failed to load exams data:', error);
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

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'MID_TERM': return 'book';
      case 'FINAL': return 'trophy';
      case 'QUIZ': return 'help-circle';
      case 'PRACTICAL': return 'flask';
      case 'ASSIGNMENT': return 'document-text';
      default: return 'calendar';
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Exams & Assessments</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Ionicons name="calendar" size={16} color={activeTab === 'upcoming' ? '#e35336' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Upcoming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.activeTab]}
          onPress={() => setActiveTab('results')}
        >
          <Ionicons name="analytics" size={16} color={activeTab === 'results' ? '#e35336' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'results' && styles.activeTabText]}>Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : activeTab === 'upcoming' ? (
          exams.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No exams scheduled</Text>
            </View>
          ) : (
            exams.map((exam) => (
              <View key={exam.id} style={styles.examCard}>
                <View style={styles.examHeader}>
                  <View style={styles.examIconContainer}>
                    <Ionicons name={getTypeIcon(exam.type) as any} size={24} color="#e35336" />
                  </View>
                  <View style={styles.examInfo}>
                    <Text style={styles.examTitle}>{exam.title}</Text>
                    <Text style={styles.examSubject}>{exam.subject?.name}</Text>
                  </View>
                  <View style={styles.scoreBadge}>
                    <Text style={styles.scoreText}>{exam.maxScore}</Text>
                  </View>
                </View>
                <View style={styles.examDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{formatDate(exam.date)}</Text>
                  </View>
                  {exam.startTime && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{exam.startTime}{exam.endTime ? ` - ${exam.endTime}` : ''}</Text>
                    </View>
                  )}
                  {exam.room && (
                    <View style={styles.detailRow}>
                      <Ionicons name="location-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{exam.room}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{exam.class?.name}{exam.section ? ` - ${exam.section.name}` : ''}</Text>
                  </View>
                </View>
              </View>
            ))
          )
        ) : (
          results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No results published yet</Text>
            </View>
          ) : (
            results.map((result) => (
              <View key={result.id} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultSubject}>{result.subject?.name}</Text>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeText}>{result.grade}</Text>
                  </View>
                </View>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: `${Math.min(result.percentage, 100)}%` }]} />
                </View>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreLabel}>{result.score}/{result.maxScore}</Text>
                  <Text style={styles.percentageText}>{result.percentage?.toFixed(1)}%</Text>
                </View>
                {result.date && (
                  <Text style={styles.resultDate}>{formatDate(result.date)}</Text>
                )}
              </View>
            ))
          )
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
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#FEE2E2' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, gap: 12 },
  examCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  examHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  examIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  examInfo: { flex: 1 },
  examTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  examSubject: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  scoreBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scoreText: { fontSize: 12, fontWeight: '700', color: '#e35336' },
  examDetails: { gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6B7280' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultSubject: { fontSize: 15, fontWeight: '600', color: '#111827' },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#D1FAE5' },
  gradeText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  scoreBar: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden' },
  scoreFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 4 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  percentageText: { fontSize: 14, color: '#10B981', fontWeight: '600' },
  resultDate: { fontSize: 12, color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
});
