import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, lessonsAPI, timetableAPI } from '@/lib/api/teacher';
import { announcementsAPI } from '@/lib/api/parent';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Lesson, Announcement } from '@/types';

export default function TeacherDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayClasses, setTodayClasses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [lessonsRes, annRes, timetableRes, attendanceRes] = await Promise.allSettled([
        lessonsAPI.getAll({ limit: 5 }),
        announcementsAPI.getAll({ limit: 3 }),
        user?.id ? timetableAPI.getByTeacher(user.id) : Promise.resolve({ data: [] }),
        attendanceAPI.getTeacherDashboard(),
      ]);

      if (lessonsRes.status === 'fulfilled') {
        setRecentLessons(unwrapArray<Lesson>(lessonsRes.value));
      }
      if (annRes.status === 'fulfilled') {
        setAnnouncements(unwrapArray<Announcement>(annRes.value));
      }
      if (timetableRes.status === 'fulfilled') {
        const today = new Date().getDay();
        setTodayClasses(unwrapArray<any>(timetableRes.value).filter((slot) => slot.dayOfWeek === today).length);
      }
      if (attendanceRes.status === 'fulfilled') {
        const dashboard = attendanceRes.value.data?.data || attendanceRes.value.data;
        if (typeof dashboard?.todayClasses === 'number') setTodayClasses(dashboard.todayClasses);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Teacher'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(teacher)/timetable')}>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>TODAY'S CLASSES</Text>
            <Text style={styles.kpiValue}>{todayClasses}</Text>
            <Text style={styles.kpiSubtext}>Classes scheduled</Text>
          </View>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar" size={20} color="#3B82F6" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(teacher)/lessons')}>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>LESSONS</Text>
            <Text style={styles.kpiValue}>{recentLessons.length}</Text>
            <Text style={styles.kpiSubtext}>Recently created</Text>
          </View>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="book" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(teacher)/attendance')}>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>ATTENDANCE</Text>
            <Text style={styles.kpiValueText}>Take</Text>
            <Text style={styles.kpiSubtext}>Mark attendance</Text>
          </View>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="trending-up" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(teacher)/grading')}>
          <View style={styles.kpiContent}>
            <Text style={styles.kpiLabel}>ENTER MARKS</Text>
            <Text style={styles.kpiValueText}>Grade</Text>
            <Text style={styles.kpiSubtext}>Submit grades</Text>
          </View>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="create" size={20} color="#F59E0B" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(teacher)/attendance')}>
          <Ionicons name="clipboard-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Take Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(teacher)/grading')}>
          <Ionicons name="create-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Enter Marks</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Lessons */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Lessons</Text>
            <Text style={styles.sectionSubtext}>Latest lessons</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(teacher)/lessons')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentLessons.length > 0 ? (
          recentLessons.map((lesson) => (
            <TouchableOpacity key={lesson.id} style={styles.lessonCard}>
              <View style={[styles.lessonIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="book" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle} numberOfLines={1}>{lesson.title}</Text>
                <Text style={styles.lessonMeta} numberOfLines={1}>
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
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>No lessons yet</Text>
          </View>
        )}
      </View>

      {/* Announcements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Announcements</Text>
            <Text style={styles.sectionSubtext}>Latest admin updates</Text>
          </View>
        </View>

        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <View
              key={ann.id}
              style={[
                styles.announcementCard,
                ann.priority === 'high' && styles.urgentAnnouncement,
              ]}
            >
              <View style={[styles.announcementIcon, ann.priority === 'high' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F3F4F6' }]}>
                <Ionicons
                  name={ann.priority === 'high' ? 'warning' : 'information-circle'}
                  size={16}
                  color={ann.priority === 'high' ? '#EF4444' : '#6B7280'}
                />
              </View>
              <View style={styles.announcementInfo}>
                <Text style={[styles.announcementTitle, ann.priority === 'high' && styles.urgentTitle]} numberOfLines={1}>
                  {ann.title}
                </Text>
                <Text style={styles.announcementContent} numberOfLines={2}>{ann.content}</Text>
                <Text style={styles.announcementDate}>{formatDate(ann.createdAt)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>No announcements</Text>
          </View>
        )}
      </View>
    </ScrollView>
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
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  logoutButton: {
    backgroundColor: '#e35336',
    padding: 10,
    borderRadius: 10,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 6,
  },
  kpiValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 6,
  },
  kpiSubtext: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 14,
    right: 14,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  quickActionText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewAllText: {
    fontSize: 13,
    color: '#e35336',
    fontWeight: '500',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  lessonIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 10,
    fontWeight: '600',
  },
  publishedText: {
    color: '#1D4ED8',
  },
  draftText: {
    color: '#6B7280',
  },
  announcementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  urgentAnnouncement: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  announcementIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  announcementInfo: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  urgentTitle: {
    color: '#991B1B',
  },
  announcementContent: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  announcementDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
