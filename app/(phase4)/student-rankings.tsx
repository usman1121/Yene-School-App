import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface RankingStudent {
  id: string;
  name: string;
  rank: number;
  totalScore: number;
  grade: string;
  className?: string;
  section?: string;
  average?: number;
}

interface ClassOption {
  id: string;
  name: string;
}

interface AcademicYear {
  id: string;
  name: string;
}

const MEDAL_ICONS = ['trophy', 'medal', 'medal-outline'] as const;
const MEDAL_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32'];

export default function StudentRankingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rankings, setRankings] = useState<RankingStudent[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calculating, setCalculating] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [classesRes, yearsRes] = await Promise.all([
        api.get('/classes').catch(() => ({ data: [] })),
        api.get('/academic-years').catch(() => ({ data: [] })),
      ]);

      const clsData = classesRes.data?.data || classesRes.data || [];
      setClasses(Array.isArray(clsData) ? clsData : []);

      const yrData = yearsRes.data?.data || yearsRes.data || [];
      setAcademicYears(Array.isArray(yrData) ? yrData : []);
    } catch (err) {
      console.error('Failed to load filter data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchRankings = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedClass) params.classId = selectedClass;
      if (selectedYear) params.academicYearId = selectedYear;

      const res = await api.get('/grading/admin/rankings', { params });
      const data = res.data?.data || res.data || [];
      setRankings(Array.isArray(data) ? data : Array.isArray(data.rankings) ? data.rankings : []);
    } catch (err) {
      console.error('Failed to load rankings:', err);
    }
  }, [selectedClass, selectedYear]);

  useEffect(() => { if (!loading) fetchRankings(); }, [fetchRankings, loading]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRankings();
    setRefreshing(false);
  }, [fetchRankings]);

  const handleCalculate = async () => {
    if (!selectedClass) {
      Alert.alert('Select Class', 'Please select a class to calculate rankings.');
      return;
    }
    setCalculating(true);
    try {
      const payload: any = { classId: selectedClass };
      if (selectedYear) payload.academicYearId = selectedYear;
      const res = await api.post('/grading/admin/calculate-rankings', payload);
      Alert.alert('Success', res.data?.message || 'Rankings calculated successfully.');
      fetchRankings();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to calculate rankings.');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#D97706';
    return '#EF4444';
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Rankings</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Rankings</Text>
        <TouchableOpacity onPress={handleCalculate} disabled={calculating}>
          {calculating ? (
            <ActivityIndicator size="small" color="#e35336" />
          ) : (
            <Ionicons name="refresh" size={22} color="#e35336" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Class</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.filterChip, !selectedClass && styles.filterChipActive]}
                onPress={() => setSelectedClass('')}
              >
                <Text style={[styles.filterChipText, !selectedClass && styles.filterChipTextActive]}>All</Text>
              </TouchableOpacity>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[styles.filterChip, selectedClass === cls.id && styles.filterChipActive]}
                  onPress={() => setSelectedClass(cls.id)}
                >
                  <Text style={[styles.filterChipText, selectedClass === cls.id && styles.filterChipTextActive]}>{cls.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {academicYears.length > 0 && (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedYear && styles.filterChipActive]}
                  onPress={() => setSelectedYear('')}
                >
                  <Text style={[styles.filterChipText, !selectedYear && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {academicYears.map((yr) => (
                  <TouchableOpacity
                    key={yr.id}
                    style={[styles.filterChip, selectedYear === yr.id && styles.filterChipActive]}
                    onPress={() => setSelectedYear(yr.id)}
                  >
                    <Text style={[styles.filterChipText, selectedYear === yr.id && styles.filterChipTextActive]}>{yr.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {rankings.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Rankings Yet</Text>
            <Text style={styles.emptyText}>Select a class and tap the refresh icon to calculate rankings.</Text>
            {selectedClass && (
              <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} disabled={calculating}>
                {calculating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="calculator" size={18} color="#FFFFFF" />
                    <Text style={styles.calcBtnText}>Calculate Rankings</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          rankings.map((student, index) => {
            const isTop3 = index < 3;
            const scoreColor = getScoreColor(student.totalScore);
            return (
              <View key={student.id} style={[styles.rankCard, isTop3 && styles.topCard]}>
                <View style={styles.rankBadge}>
                  {isTop3 ? (
                    <Ionicons name={MEDAL_ICONS[index]} size={22} color={MEDAL_COLORS[index]} />
                  ) : (
                    <Text style={styles.rankNumber}>#{student.rank}</Text>
                  )}
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{student.name}</Text>
                  {(student.className || student.section) && (
                    <Text style={styles.rankClass}>
                      {student.className}{student.section ? ` - ${student.section}` : ''}
                    </Text>
                  )}
                </View>
                <View style={styles.rankScore}>
                  <Text style={[styles.scoreValue, { color: scoreColor }]}>
                    {student.totalScore?.toFixed(1)}
                  </Text>
                  <View style={[styles.gradeBadge, { backgroundColor: scoreColor + '20' }]}>
                    <Text style={[styles.gradeText, { color: scoreColor }]}>{student.grade}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  filterBar: { backgroundColor: '#FFFFFF', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterScroll: { paddingHorizontal: 16, gap: 12 },
  filterGroup: { gap: 6 },
  filterLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 6 },
  filterChipActive: { backgroundColor: '#FEE2E2' },
  filterChipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  filterChipTextActive: { color: '#e35336' },
  content: { padding: 16, gap: 10 },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  topCard: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  rankBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rankNumber: { fontSize: 16, fontWeight: '800', color: '#6B7280' },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rankClass: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  rankScore: { alignItems: 'flex-end', gap: 4 },
  scoreValue: { fontSize: 18, fontWeight: '700' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  gradeText: { fontSize: 11, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
  calcBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e35336', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  calcBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
