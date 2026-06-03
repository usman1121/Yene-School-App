import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { superAdminApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SuperAdminDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await superAdminApi.getDashboard();
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
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(super-admin)/schools')}>
          <Text style={styles.kpiLabel}>SCHOOLS</Text>
          <Text style={styles.kpiValue}>{stats.totalSchools || stats.schools || 0}</Text>
          <Text style={styles.kpiSubtext}>Registered</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="business" size={20} color="#3B82F6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard} onPress={() => router.push('/(super-admin)/schools')}>
          <Text style={styles.kpiLabel}>ACTIVE</Text>
          <Text style={styles.kpiValue}>{stats.activeSchools || 0}</Text>
          <Text style={styles.kpiSubtext}>Active schools</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>USERS</Text>
          <Text style={styles.kpiValue}>{stats.totalUsers || 0}</Text>
          <Text style={styles.kpiSubtext}>Across all schools</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="people" size={20} color="#8B5CF6" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>REVENUE</Text>
          <Text style={styles.kpiValue}>{stats.totalRevenue ? `${(stats.totalRevenue / 1000).toFixed(1)}K` : 'N/A'}</Text>
          <Text style={styles.kpiSubtext}>Total</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trending-up" size={20} color="#F59E0B" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(super-admin)/schools')}>
          <Ionicons name="business-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Manage Schools</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(super-admin)/settings')}>
          <Ionicons name="settings-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)')}>
          <Ionicons name="apps-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>All Features</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/school-admins')}>
          <Ionicons name="person-circle-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>School Admins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/subscriptions')}>
          <Ionicons name="diamond-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Subscriptions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => router.push('/(phase4)/announcements')}>
          <Ionicons name="megaphone-outline" size={16} color="#374151" />
          <Text style={styles.quickActionText}>Announcements</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
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
});
