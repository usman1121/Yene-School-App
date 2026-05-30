import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { adminAcademicYearsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { AcademicYear, Term } from '@/types';

export default function AdminAcademicYearsScreen() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Record<string, Term[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminAcademicYearsApi.getAcademicYears();
      const data = unwrapArray<AcademicYear>(res);
      setYears(data);
      const termsMap: Record<string, Term[]> = {};
      await Promise.all(data.map(async (yr) => {
        try {
          const tRes = await adminAcademicYearsApi.getTerms(yr.id);
          termsMap[yr.id] = unwrapArray<Term>(tRes);
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
                  {(terms[year.id] || []).length > 0 ? (
                    terms[year.id].map((term) => (
                      <View key={term.id} style={styles.termItem}>
                        <Text style={styles.termName}>{term.name}</Text>
                        <View style={styles.termMeta}>
                          <Text style={styles.termWeight}>{term.percentageWeight}%</Text>
                          {term.isLocked && <Text style={styles.lockedText}>Locked</Text>}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTerms}>No terms</Text>
                  )}
                </View>
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
  termItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  termName: { fontSize: 14, color: '#374151' },
  termMeta: { flexDirection: 'row', gap: 8 },
  termWeight: { fontSize: 12, color: '#6B7280' },
  lockedText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  noTerms: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
});
