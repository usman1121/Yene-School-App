import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { adminDashboardApi, adminUsersApi, adminClassesApi, announcementsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);
  const [teacherCount, setTeacherCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, teachersRes, classesRes, annRes] = await Promise.allSettled([
        adminUsersApi.getUsers({ limit: 1 }),
        adminUsersApi.getTeachers({ limit: 1 }),
        adminClassesApi.getClasses(),
        announcementsApi.getAll({ limit: 5 }),
      ]);
      if (usersRes.status === 'fulfilled') {
        const data = usersRes.value.data;
        setUserCount(data?.meta?.total || data?.data?.length || 0);
      }
      if (teachersRes.status === 'fulfilled') {
        const data = teachersRes.value.data;
        setTeacherCount(data?.meta?.total || data?.data?.length || 0);
      }
      if (classesRes.status === 'fulfilled') setClassCount(unwrapArray(classesRes.value).length);
      if (annRes.status === 'fulfilled') setAnnouncements(unwrapArray(annRes.value));
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Admin'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.moreButton} onPress={() => router.push('/(phase4)')}>
            <Ionicons name="ellipsis-horizontal-circle" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/users')}>
          <Text style={styles.kpiLabel}>USERS</Text>
          <Text style={styles.kpiValue}>{userCount}</Text>
          <Text style={styles.kpiSubtext}>Total users</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="people" size={20} color="#3B82F6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/users')}>
          <Text style={styles.kpiLabel}>TEACHERS</Text>
          <Text style={styles.kpiValue}>{teacherCount}</Text>
          <Text style={styles.kpiSubtext}>Active teachers</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="school" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/classes')}>
          <Text style={styles.kpiLabel}>CLASSES</Text>
          <Text style={styles.kpiValue}>{classCount}</Text>
          <Text style={styles.kpiSubtext}>Active classes</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="layers" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(admin)/academic-years')}>
          <Text style={styles.kpiLabel}>YEARS</Text>
          <Text style={styles.kpiValue}>{'View'}</Text>
          <Text style={styles.kpiSubtext}>Academic years</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="calendar" size={20} color="#F59E0B" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(admin)/users')}>
          <Ionicons name="person-add-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Add User</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(admin)/classes')}>
          <Ionicons name="layers-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Manage Classes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(admin)/subjects')}>
          <Ionicons name="book-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Subjects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)')}>
          <Ionicons name="apps-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>All Features</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/announcements')}>
          <Ionicons name="megaphone-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Announcements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/events')}>
          <Ionicons name="calendar-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/exams')}>
          <Ionicons name="document-text-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Exams</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/staff')}>
          <Ionicons name="people-circle-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Staff</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/timetable')}>
          <Ionicons name="time-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Timetable</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/admin-attendance')}>
          <Ionicons name="calendar-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/school-settings')}>
          <Ionicons name="settings-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Announcements</Text>
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <View key={ann.id} style={styles.announcementCard}>
              <View style={[styles.announcementIcon, ann.priority === 'high' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name={ann.priority === 'high' ? 'warning' : 'information-circle'} size={16} color={ann.priority === 'high' ? '#EF4444' : '#6B7280'} />
              </View>
              <View style={styles.announcementInfo}>
                <Text style={styles.announcementTitle} numberOfLines={1}>{ann.title}</Text>
                <Text style={styles.announcementContent} numberOfLines={1}>{ann.content}</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  moreButton: { padding: 8, borderRadius: 10, backgroundColor: '#F3F4F6' },
  logoutButton: { backgroundColor: '#e35336', padding: 10, borderRadius: 10 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  kpiCard: { flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  kpiLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 6 },
  kpiSubtext: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  kpiIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 14, right: 14 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  quickActionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  announcementCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  announcementIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  announcementInfo: { flex: 1 },
  announcementTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  announcementContent: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
});
