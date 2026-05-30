import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { adminClassesApi, adminSectionsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { Class, Section } from '@/types';

export default function AdminClassesScreen() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Record<string, Section[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await adminClassesApi.getClasses();
      const data = unwrapArray<Class>(res);
      setClasses(data);
      const sectionMap: Record<string, Section[]> = {};
      await Promise.all(data.map(async (cls) => {
        try {
          const secRes = await adminSectionsApi.getSections(cls.id);
          sectionMap[cls.id] = unwrapArray<Section>(secRes);
        } catch { sectionMap[cls.id] = []; }
      }));
      setSections(sectionMap);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
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

  const toggleExpand = (classId: string) => {
    setExpandedClass(expandedClass === classId ? null : classId);
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
        <Text style={styles.headerTitle}>Classes</Text>
        <Text style={styles.headerSubtext}>{classes.length} class(es)</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="layers-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        ) : (
          classes.map((cls) => (
            <View key={cls.id} style={styles.classCard}>
              <TouchableOpacity style={styles.classHeader} onPress={() => toggleExpand(cls.id)}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classGrade}>Grade {cls.grade}</Text>
                </View>
                <View style={styles.classMeta}>
                  <Text style={styles.sectionCount}>{sections[cls.id]?.length || 0} sections</Text>
                  <Ionicons name={expandedClass === cls.id ? 'chevron-up' : 'chevron-down'} size={18} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
              {expandedClass === cls.id && (
                <View style={styles.sectionList}>
                  {(sections[cls.id] || []).length > 0 ? (
                    sections[cls.id].map((sec) => (
                      <View key={sec.id} style={styles.sectionItem}>
                        <Text style={styles.sectionName}>Section {sec.name}</Text>
                        {sec.capacity && <Text style={styles.sectionCapacity}>Capacity: {sec.capacity}</Text>}
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noSections}>No sections</Text>
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
  classCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10, overflow: 'hidden' },
  classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: '#111827' },
  classGrade: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  classMeta: { alignItems: 'flex-end', gap: 4 },
  sectionCount: { fontSize: 12, color: '#6B7280' },
  sectionList: { borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 14 },
  sectionItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sectionName: { fontSize: 14, color: '#374151' },
  sectionCapacity: { fontSize: 12, color: '#9CA3AF' },
  noSections: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingVertical: 8 },
});
