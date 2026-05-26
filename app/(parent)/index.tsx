import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { parentDashboardAPI } from '@/lib/api/parent';
import { normalizeChild, unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Child } from '@/types';

export default function ParentDashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [dashboardRes, childrenRes] = await Promise.allSettled([
        parentDashboardAPI.getDashboard(),
        parentDashboardAPI.getChildren(),
      ]);
      const data = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data : {};
      const dashboardChildren = data?.stats?.children || [];
      const linkedChildren = childrenRes.status === 'fulfilled' ? unwrapArray(childrenRes.value) : [];
      const dashboardMap = new Map(dashboardChildren.map((child: any) => [child.id, child]));
      const sourceChildren = linkedChildren.length > 0 ? linkedChildren : dashboardChildren;
      const childrenData = sourceChildren.map((child: any) => {
        const normalized = normalizeChild(child);
        const dashboardChild = dashboardMap.get(normalized.userId || normalized.id) as any;
        return normalizeChild({ ...dashboardChild, ...normalized });
      });
      setChildren(childrenData);
      setNotices(data.recentNotices || []);
      setActivity(data.recentActivity || []);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const attendancePercentage = selectedChild ? parseFloat(selectedChild.attendance) : 0;
  const feeBalance = selectedChild?.feeBalance || 0;
  const upcomingExams = selectedChild?.upcomingExams || 0;

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
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
          <Text style={styles.headerSubtext}>Monitor your children's progress</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
          {children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childChip,
                selectedChild?.id === child.id && styles.childChipActive,
              ]}
              onPress={() => setSelectedChild(child)}
            >
              <View style={[styles.childAvatar, selectedChild?.id === child.id && { backgroundColor: '#FFFFFF' }]}>
                <Text style={[styles.childAvatarText, selectedChild?.id === child.id && { color: '#e35336' }]}>
                  {child.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.childName, selectedChild?.id === child.id && styles.childNameActive]}>
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Selected Child Info */}
      {selectedChild && (
        <View style={styles.childInfoCard}>
          <View style={styles.childAvatarLarge}>
            <Text style={styles.childAvatarLargeText}>
              {selectedChild.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.childDetails}>
            <Text style={styles.childNameLarge}>{selectedChild.name}</Text>
            <Text style={styles.childClass}>
              Grade {selectedChild.className} · Section {selectedChild.section}
            </Text>
          </View>
          <View style={styles.childCode}>
            <Text style={styles.childCodeLabel}>Student Code</Text>
            <Text style={styles.childCodeValue}>{selectedChild.studentCode}</Text>
          </View>
        </View>
      )}

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ATTENDANCE</Text>
          <Text style={styles.kpiValue}>{attendancePercentage}%</Text>
          <Text style={styles.kpiSubtext}>This term</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar" size={18} color="#3B82F6" />
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>UPCOMING EXAMS</Text>
          <Text style={styles.kpiValue}>{upcomingExams}</Text>
          <Text style={styles.kpiSubtext}>Scheduled</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="document-text" size={18} color="#8B5CF6" />
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>OVERALL GRADE</Text>
          <Text style={styles.kpiValue}>{selectedChild?.overallGrade || 'N/A'}</Text>
          <Text style={styles.kpiSubtext}>Current term</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="trophy" size={18} color="#10B981" />
          </View>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>FEE BALANCE</Text>
          <Text style={[styles.kpiValue, feeBalance > 0 ? { color: '#F59E0B' } : { color: '#10B981' }]}>
            {feeBalance.toLocaleString()} Br
          </Text>
          <Text style={styles.kpiSubtext}>{feeBalance > 0 ? 'Due' : 'Paid'}</Text>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash" size={18} color="#F59E0B" />
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {selectedChild && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/(parent)/[childId]/attendance?childId=${selectedChild.userId || selectedChild.id}&name=${selectedChild.name}`)}
          >
            <Ionicons name="calendar-outline" size={16} color="#374151" />
            <Text style={styles.quickActionText}>Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/(parent)/[childId]/grades?childId=${selectedChild.userId || selectedChild.id}&name=${selectedChild.name}`)}
          >
            <Ionicons name="school-outline" size={16} color="#374151" />
            <Text style={styles.quickActionText}>Grades</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/(parent)/[childId]/fees?childId=${selectedChild.userId || selectedChild.id}&name=${selectedChild.name}`)}
          >
            <Ionicons name="cash-outline" size={16} color="#374151" />
            <Text style={styles.quickActionText}>Fees</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push(`/(parent)/[childId]/timetable?childId=${selectedChild.userId || selectedChild.id}&name=${selectedChild.name}`)}
          >
            <Ionicons name="time-outline" size={16} color="#374151" />
            <Text style={styles.quickActionText}>Timetable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Attendance Trend */}
      {selectedChild?.attendanceTrend && selectedChild.attendanceTrend.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Trend</Text>
          <Text style={styles.sectionSubtext}>This term</Text>
          <View style={styles.trendChart}>
            {selectedChild.attendanceTrend.map((item, index) => (
              <View key={index} style={styles.trendBar}>
                <View style={styles.trendBarFill}>
                  <View
                    style={[
                      styles.trendBarInner,
                      { height: `${item.percentage}%` },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{item.week}</Text>
                <Text style={styles.trendValue}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Notices */}
      {notices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notices</Text>
          {notices.map((notice) => (
            <View key={notice.id} style={styles.noticeCard}>
              <View style={[styles.noticeIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="notifications" size={16} color="#3B82F6" />
              </View>
              <View style={styles.noticeInfo}>
                <Text style={styles.noticeTitle} numberOfLines={1}>{notice.title}</Text>
                {notice.description && (
                  <Text style={styles.noticeDesc} numberOfLines={1}>{notice.description}</Text>
                )}
                <Text style={styles.noticeDate}>{notice.date}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Fee Summary */}
      {selectedChild && (selectedChild.totalDue || 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Summary</Text>
          <View style={styles.feeCard}>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Due</Text>
              <Text style={styles.feeValue}>{selectedChild.totalDue.toLocaleString()} Br</Text>
            </View>
            <View style={styles.feeRow}>
              <Text style={styles.feeLabel}>Total Paid</Text>
              <Text style={[styles.feeValue, { color: '#10B981' }]}>{selectedChild.totalPaid.toLocaleString()} Br</Text>
            </View>
            <View style={[styles.feeRow, styles.feeBalanceRow]}>
              <Text style={styles.feeBalanceLabel}>Balance</Text>
              <Text style={[styles.feeBalanceValue, feeBalance > 0 ? { color: '#F59E0B' } : { color: '#10B981' }]}>
                {feeBalance.toLocaleString()} Br
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Activity */}
      {activity.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {activity.map((item, index) => (
            <View key={item.id} style={[styles.activityItem, index < activity.length - 1 && styles.activityBorder]}>
              <View style={[styles.activityIcon, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons
                  name={
                    item.type === 'payment' ? 'cash' :
                    item.type === 'grade' ? 'document-text' :
                    item.type === 'attendance' ? 'checkmark-circle' :
                    'notifications'
                  }
                  size={14}
                  color="#6B7280"
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityMessage}>{item.message}</Text>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    padding: 16,
    paddingTop: 16,
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
  logoutButton: {
    backgroundColor: '#e35336',
    padding: 10,
    borderRadius: 10,
  },
  childSelector: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  childChipActive: {
    backgroundColor: '#e35336',
    borderColor: '#e35336',
  },
  childAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e35336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  childNameActive: {
    color: '#FFFFFF',
  },
  childInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  childAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e35336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  childAvatarLargeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childDetails: {
    flex: 1,
  },
  childNameLarge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  childClass: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  childCode: {
    alignItems: 'flex-end',
  },
  childCodeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  childCodeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 20,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 14,
    right: 14,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'flex-end',
    height: 160,
  },
  trendBar: {
    alignItems: 'center',
    flex: 1,
  },
  trendBarFill: {
    width: 24,
    height: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    justifyContent: 'flex-end',
    marginBottom: 6,
  },
  trendBarInner: {
    width: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  trendLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  trendValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 8,
  },
  noticeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noticeInfo: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  noticeDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  noticeDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  feeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  feeBalanceRow: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  feeBalanceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  feeBalanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#111827',
  },
  activityDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
