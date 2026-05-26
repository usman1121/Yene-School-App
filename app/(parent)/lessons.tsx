import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { childrenAPI, parentLessonsAPI } from '@/lib/api/parent';
import { normalizeChild, unwrapArray } from '@/lib/api/utils';
import type { Child, Lesson } from '@/types';

export default function ParentLessonsScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const selectedChild = useMemo(
    () => children.find((child) => (child.userId || child.id) === selectedChildId),
    [children, selectedChildId],
  );

  const fetchData = useCallback(async () => {
    try {
      const childrenRes = await childrenAPI.getMyChildren();
      const normalizedChildren = unwrapArray(childrenRes).map((child) => normalizeChild(child));
      setChildren(normalizedChildren);
      const targetId = selectedChildId || normalizedChildren[0]?.userId || normalizedChildren[0]?.id || '';
      setSelectedChildId(targetId);

      if (targetId) {
        const lessonsRes = await parentLessonsAPI.getChildLessons(targetId, { limit: 50 });
        setLessons(unwrapArray<Lesson>(lessonsRes));
      } else {
        setLessons([]);
      }
    } catch (error) {
      console.error('Failed to fetch parent lessons:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedChildId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
        <Text style={styles.headerTitle}>Lessons</Text>
        <Text style={styles.headerSubtext}>{selectedChild?.name || 'Child'} learning materials</Text>
      </View>

      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
          {children.map((child) => {
            const id = child.userId || child.id;
            const active = id === selectedChildId;
            return (
              <TouchableOpacity key={id} style={[styles.childChip, active && styles.childChipActive]} onPress={() => setSelectedChildId(id)}>
                <Text style={[styles.childChipText, active && styles.childChipTextActive]}>{child.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No lessons available</Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonCard}>
              <View style={styles.lessonIcon}>
                <Ionicons name={lesson.isPublished ? 'checkmark-circle' : 'document-text-outline'} size={20} color="#e35336" />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle} numberOfLines={2}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {lesson.subject?.name || 'Subject'} · {lesson.class?.name || selectedChild?.className || 'Class'}
                </Text>
              </View>
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
  childSelector: { paddingHorizontal: 16, paddingBottom: 12 },
  childChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', marginRight: 8 },
  childChipActive: { backgroundColor: '#e35336', borderColor: '#e35336' },
  childChipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  childChipTextActive: { color: '#FFFFFF' },
  list: { flex: 1, paddingHorizontal: 16 },
  lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  lessonIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  lessonMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});
