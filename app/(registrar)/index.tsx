import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { registrarApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RegistrarDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await registrarApi.getDashboard();
      const data = res.data?.data || res.data || {};
      setStats(data?.stats || data);
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
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0] || 'Registrar'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiGrid}>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(registrar)/students')}>
          <Text style={styles.kpiLabel}>STUDENTS</Text>
          <Text style={styles.kpiValue}>{stats.totalStudents || stats.students || 0}</Text>
          <Text style={styles.kpiSubtext}>Enrolled</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="people" size={20} color="#3B82F6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(registrar)/enrollments')}>
          <Text style={styles.kpiLabel}>PENDING</Text>
          <Text style={styles.kpiValue}>{stats.pendingEnrollments || 0}</Text>
          <Text style={styles.kpiSubtext}>Enrollments</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={20} color="#F59E0B" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(registrar)/students')}>
          <Text style={styles.kpiLabel}>CLASSES</Text>
          <Text style={styles.kpiValue}>{stats.totalClasses || 0}</Text>
          <Text style={styles.kpiSubtext}>Active</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="layers" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>SECTIONS</Text>
          <Text style={styles.kpiValue}>{stats.totalSections || 0}</Text>
          <Text style={styles.kpiSubtext}>Active</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="grid" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(registrar)/enrollments')}>
          <Ionicons name="add-circle-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>New Enrollment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(registrar)/students')}>
          <Ionicons name="search-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Find Student</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 20, paddingTop: 16 },
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
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
});
