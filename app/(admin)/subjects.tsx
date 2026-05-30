import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { adminSubjectsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { Subject } from '@/types';

export default function AdminSubjectsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await adminSubjectsApi.getSubjects();
      setSubjects(unwrapArray<Subject>(res));
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubjects();
    setRefreshing(false);
  }, [fetchSubjects]);

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
        <Text style={styles.headerTitle}>Subjects</Text>
        <Text style={styles.headerSubtext}>{subjects.length} subject(s)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {subjects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No subjects found</Text>
          </View>
        ) : (
          subjects.map((subject) => (
            <View key={subject.id} style={styles.subjectCard}>
              <View style={[styles.subjectIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="book" size={20} color="#8B5CF6" />
              </View>
              <View style={styles.subjectInfo}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                {subject.code && <Text style={styles.subjectCode}>Code: {subject.code}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
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
  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  subjectIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  subjectInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  subjectCode: { fontSize: 12, color: '#6B7280', marginTop: 2 },
});
