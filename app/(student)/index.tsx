import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { studentApi } from '@/api';
import { announcementsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { SubjectGrade, Announcement, TimetableSlot } from '@/types';

export default function StudentDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [grades, setGrades] = useState<SubjectGrade[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [gradesRes, annRes, timetableRes, attendanceRes] = await Promise.allSettled([
        studentApi.getMyGrades(),
        announcementsApi.getAll({ limit: 3 }),
        studentApi.getMyTimetable(),
        studentApi.getMyAttendanceSummary(),
      ]);

      if (gradesRes.status === 'fulfilled') setGrades(unwrapArray<SubjectGrade>(gradesRes.value));
      if (annRes.status === 'fulfilled') setAnnouncements(unwrapArray<Announcement>(annRes.value));
      if (timetableRes.status === 'fulfilled') setTimetable(unwrapArray<TimetableSlot>(timetableRes.value));
      if (attendanceRes.status === 'fulfilled') setAttendanceSummary(attendanceRes.value.data || attendanceRes.value);
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

  const today = new Date().getDay();
  const todaySlots = timetable.filter((s) => s.dayOfWeek === today);
  const avgGrade = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.totalScore || 0), 0) / grades.length)
    : null;
  const attendanceRate = attendanceSummary?.rate ?? attendanceSummary?.percentage ?? null;

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
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Student'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(student)/grades')}>
          <Text style={styles.kpiLabel}>AVERAGE GRADE</Text>
          <Text style={styles.kpiValue}>{avgGrade !== null ? `${avgGrade}%` : 'N/A'}</Text>
          <Text style={styles.kpiSubtext}>Current term</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="school" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(student)/attendance')}>
          <Text style={styles.kpiLabel}>ATTENDANCE</Text>
          <Text style={styles.kpiValue}>{attendanceRate !== null ? `${attendanceRate}%` : 'N/A'}</Text>
          <Text style={styles.kpiSubtext}>This term</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar" size={20} color="#3B82F6" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(student)/timetable')}>
          <Text style={styles.kpiLabel}>TODAY</Text>
          <Text style={styles.kpiValue}>{todaySlots.length}</Text>
          <Text style={styles.kpiSubtext}>Classes today</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="time" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(student)/lessons')}>
          <Text style={styles.kpiLabel}>LESSONS</Text>
          <Text style={styles.kpiValue}>{grades.length}</Text>
          <Text style={styles.kpiSubtext}>Subjects enrolled</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="book" size={20} color="#F59E0B" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(student)/timetable')}>
          <Ionicons name="calendar-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Timetable</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(student)/grades')}>
          <Ionicons name="school-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>My Grades</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(student)/attendance')}>
          <Ionicons name="clipboard-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Attendance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.sectionSubtext}>{todaySlots.length > 0 ? `${todaySlots.length} class(es)` : 'No classes today'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(student)/timetable')}>
            <Text style={styles.viewAllText}>Full Week</Text>
          </TouchableOpacity>
        </View>
        {todaySlots.length > 0 ? (
          todaySlots.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.slotTimeBlock}>
                <Text style={styles.slotTime}>{slot.startTime.slice(0, 5)}</Text>
              </View>
              <View style={styles.slotInfo}>
                <Text style={styles.slotSubject}>{slot.subject.name}</Text>
                <Text style={styles.slotRoom}>Room {slot.room || 'TBD'} · {slot.class.name}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={32} color="#D1D5DB" />
            <Text style={styles.emptyText}>No classes scheduled</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Announcements</Text>
        {announcements.length > 0 ? (
          announcements.map((ann) => (
            <View key={ann.id} style={[styles.announcementCard, ann.priority === 'high' && styles.urgentAnnouncement]}>
              <View style={[styles.announcementIcon, ann.priority === 'high' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name={ann.priority === 'high' ? 'warning' : 'information-circle'} size={16} color={ann.priority === 'high' ? '#EF4444' : '#6B7280'} />
              </View>
              <View style={styles.announcementInfo}>
                <Text style={[styles.announcementTitle, ann.priority === 'high' && styles.urgentTitle]} numberOfLines={1}>{ann.title}</Text>
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
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  logoutButton: { backgroundColor: '#e35336', padding: 10, borderRadius: 10 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  kpiCard: { flex: 1, minWidth: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  kpiContent: { flex: 1 },
  kpiLabel: { fontSize: 10, fontWeight: '600', color: '#6B7280', letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 6 },
  kpiSubtext: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  kpiIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 14, right: 14 },
  quickActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  quickActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#FFFFFF' },
  quickActionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sectionSubtext: { fontSize: 12, color: '#6B7280' },
  viewAllText: { fontSize: 13, color: '#e35336', fontWeight: '500' },
  slotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 8 },
  slotTimeBlock: { width: 50, alignItems: 'center', marginRight: 12 },
  slotTime: { fontSize: 13, fontWeight: '600', color: '#e35336' },
  slotInfo: { flex: 1 },
  slotSubject: { fontSize: 14, fontWeight: '600', color: '#111827' },
  slotRoom: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  announcementCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  urgentAnnouncement: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  announcementIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  announcementInfo: { flex: 1 },
  announcementTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  urgentTitle: { color: '#991B1B' },
  announcementContent: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
