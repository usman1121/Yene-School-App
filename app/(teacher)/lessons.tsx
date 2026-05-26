import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { lessonsAPI } from '@/lib/api/teacher';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { Lesson } from '@/types';

export default function TeacherLessonsScreen() {
  const { user } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await lessonsAPI.getAll({ limit: 50 });
      setLessons(unwrapArray<Lesson>(res));
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLessons();
    setRefreshing(false);
  }, [fetchLessons]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
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
        <Text style={styles.headerTitle}>My Lessons</Text>
        <Text style={styles.headerSubtext}>
          {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />
        }
      >
        {lessons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No lessons yet</Text>
          </View>
        ) : (
          lessons.map((lesson) => (
            <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
              <View style={[styles.lessonIcon, lesson.isPublished ? { backgroundColor: '#DBEAFE' } : { backgroundColor: '#F3F4F6' }]}>
                <Ionicons
                  name={lesson.isPublished ? 'checkmark-circle' : 'pencil'}
                  size={20}
                  color={lesson.isPublished ? '#3B82F6' : '#6B7280'}
                />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {lesson.subject?.name || 'Unknown'} · {formatDate(lesson.createdAt)}
                </Text>
              </View>
              <View style={[styles.statusBadge, lesson.isPublished ? styles.publishedBadge : styles.draftBadge]}>
                <Text style={[styles.statusText, lesson.isPublished ? styles.publishedText : styles.draftText]}>
                  {lesson.isPublished ? 'Published' : 'Draft'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
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
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  lessonIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  lessonMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publishedBadge: {
    backgroundColor: '#DBEAFE',
  },
  draftBadge: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  publishedText: {
    color: '#1D4ED8',
  },
  draftText: {
    color: '#6B7280',
  },
});
