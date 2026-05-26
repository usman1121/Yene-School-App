import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { childrenAPI } from '@/lib/api/parent';
import { normalizeChild, unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { Child } from '@/types';

export default function ChildDetailScreen() {
  const { childId, name } = useLocalSearchParams();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChild = useCallback(async () => {
    try {
      const res = await childrenAPI.getChildDetail(childId as string);
      setChild(normalizeChild(unwrapData(res, res.data)));
    } catch (error) {
      console.error('Failed to fetch child:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchChild();
  }, [fetchChild]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  const attendancePercentage = child ? parseFloat(child.attendance) : 0;
  const feeBalance = child?.feeBalance || 0;

  return (
    <ScrollView style={styles.container}>
      {/* Child Header */}
      <View style={styles.childHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{child?.name?.charAt(0) || 'C'}</Text>
        </View>
        <Text style={styles.childName}>{child?.name || name}</Text>
          <Text style={styles.childClass}>
          Grade {child?.className} · Section {child?.section}
        </Text>
        {child?.homeroomTeacher?.name && (
          <Text style={styles.childClass}>Homeroom: {child.homeroomTeacher.name}</Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
          <Text style={styles.statValue}>{attendancePercentage}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="school-outline" size={24} color="#10B981" />
          <Text style={styles.statValue}>{child?.overallGrade || 'N/A'}</Text>
          <Text style={styles.statLabel}>Grade</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
          <Text style={styles.statValue}>{child?.upcomingExams || 0}</Text>
          <Text style={styles.statLabel}>Exams</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#F59E0B" />
          <Text style={[styles.statValue, feeBalance > 0 ? { color: '#F59E0B' } : { color: '#10B981' }]}>
            {feeBalance.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Fee Balance</Text>
        </View>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push(`/(parent)/[childId]/attendance?childId=${childId}&name=${name}`)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="calendar" size={20} color="#3B82F6" />
          </View>
          <View style={styles.quickLinkInfo}>
            <Text style={styles.quickLinkTitle}>Attendance</Text>
            <Text style={styles.quickLinkDesc}>View attendance records</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push(`/(parent)/[childId]/grades?childId=${childId}&name=${name}`)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="school" size={20} color="#10B981" />
          </View>
          <View style={styles.quickLinkInfo}>
            <Text style={styles.quickLinkTitle}>Grades & Results</Text>
            <Text style={styles.quickLinkDesc}>View academic performance</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push(`/(parent)/[childId]/fees?childId=${childId}&name=${name}`)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash" size={20} color="#F59E0B" />
          </View>
          <View style={styles.quickLinkInfo}>
            <Text style={styles.quickLinkTitle}>Fees</Text>
            <Text style={styles.quickLinkDesc}>View fee details and payments</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push(`/(parent)/[childId]/timetable?childId=${childId}&name=${name}`)}
        >
          <View style={[styles.quickLinkIcon, { backgroundColor: '#F3E8FF' }]}>
            <Ionicons name="time" size={20} color="#8B5CF6" />
          </View>
          <View style={styles.quickLinkInfo}>
            <Text style={styles.quickLinkTitle}>Timetable</Text>
            <Text style={styles.quickLinkDesc}>View class schedule</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
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
  },
  childHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e35336',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  childClass: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  quickLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickLinkInfo: {
    flex: 1,
  },
  quickLinkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  quickLinkDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
