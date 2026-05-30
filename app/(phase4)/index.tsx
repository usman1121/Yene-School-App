import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
  color?: string;
  section?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function Phase4HubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = user?.role || '';

  const sections: MenuSection[] = useMemo(() => [
    {
      title: 'General',
      items: [
        { icon: 'search', label: 'Search', route: '/(phase4)/search', color: '#10B981' },
        { icon: 'help-circle', label: 'Help Center', route: '/(phase4)/help', color: '#6B7280' },
      ],
    },
    {
      title: 'Communication',
      items: [
        { icon: 'chatbubbles', label: 'Messages', route: '/(phase4)/messaging', roles: ['TEACHER', 'ADMIN', 'IT_MANAGER', 'REGISTRAR', 'FINANCE', 'SUPER_ADMIN'], color: '#3B82F6' },
        { icon: 'chatbubble-ellipses', label: 'Communication Book', route: '/(phase4)/communications', roles: ['TEACHER', 'ADMIN', 'PARENT', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#14B8A6' },
        { icon: 'megaphone', label: 'Announcements', route: '/(phase4)/announcements', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER', 'STUDENT', 'PARENT', 'REGISTRAR', 'FINANCE', 'SUPER_ADMIN'], color: '#F97316' },
      ],
    },
    {
      title: 'Exams & Grades',
      items: [
        { icon: 'document-text', label: 'Exams & Assessments', route: '/(phase4)/exams', roles: ['STUDENT', 'TEACHER', 'ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#EC4899' },
        { icon: 'grid', label: 'Exam Seating', route: '/(phase4)/exam-seating', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#D946EF' },
        { icon: 'trending-up', label: 'Entry Progress', route: '/(phase4)/entry-progress', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#F43F5E' },
        { icon: 'checkmark-circle', label: 'Publish Results', route: '/(phase4)/publish-results', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#22C55E' },
        { icon: 'newspaper', label: 'Report Cards', route: '/(phase4)/report-cards', roles: ['STUDENT', 'PARENT', 'ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#6366F1' },
        { icon: 'bar-chart', label: 'Performance Brief', route: '/(phase4)/performance-brief', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#8B5CF6' },
        { icon: 'checkmark-circle', label: 'Student Data Health', route: '/(phase4)/data-health', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#06B6D4' },
        { icon: 'document', label: 'Certificate Template', route: '/(phase4)/certificate-template', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#D97706' },
      ],
    },
    {
      title: 'Students',
      items: [
        { icon: 'people', label: 'All Students', route: '/(admin)/users', roles: ['ADMIN', 'IT_MANAGER', 'REGISTRAR'], color: '#3B82F6' },
        { icon: 'person-add', label: 'Student Admission', route: '/(phase4)/student-admission', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#2563EB' },
        { icon: 'school', label: 'Student Promotion', route: '/(phase4)/student-promotion', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#7C3AED' },
        { icon: 'trophy', label: 'Student Rankings', route: '/(phase4)/student-rankings', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#F59E0B' },
        { icon: 'card', label: 'ID Cards', route: '/(phase4)/id-cards', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#0EA5E9' },
      ],
    },
    {
      title: 'People',
      items: [
        { icon: 'people-circle', label: 'Staff', route: '/(phase4)/staff', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#6B7280' },
        { icon: 'people', label: 'Parents', route: '/(phase4)/parents', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#A855F7' },
      ],
    },
    {
      title: 'Academics',
      items: [
        { icon: 'calendar', label: 'Events Calendar', route: '/(phase4)/events', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER', 'STUDENT', 'PARENT', 'REGISTRAR', 'FINANCE', 'SUPER_ADMIN'], color: '#8B5CF6' },
        { icon: 'time', label: 'Timetable', route: '/(phase4)/timetable', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], color: '#14B8A6' },
        { icon: 'people', label: 'Assign Teachers', route: '/(phase4)/assign-teachers', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#EC4899' },
        { icon: 'calendar-number', label: 'Period Times', route: '/(phase4)/period-times', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#F97316' },
      ],
    },
    {
      title: 'Management',
      items: [
        { icon: 'calendar-check', label: 'Attendance (Admin)', route: '/(phase4)/admin-attendance', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#10B981' },
        { icon: 'shield', label: 'Discipline', route: '/(phase4)/discipline', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER'], color: '#EF4444' },
        { icon: 'cloud-upload', label: 'Bulk Upload', route: '/(phase4)/bulk-upload', roles: ['ADMIN', 'IT_MANAGER', 'REGISTRAR', 'FINANCE', 'SUPER_ADMIN'], color: '#F59E0B' },
        { icon: 'key', label: 'Credentials', route: '/(phase4)/credentials', roles: ['ADMIN', 'REGISTRAR', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#8B5CF6' },
        { icon: 'settings', label: 'School Settings', route: '/(phase4)/school-settings', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#6B7280' },
        { icon: 'alarm', label: 'School Siren', route: '/(phase4)/siren', roles: ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#EF4444' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { icon: 'trending-up', label: 'Finance Reports', route: '/(phase4)/finance-reports', roles: ['FINANCE', 'ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'], color: '#22C55E' },
      ],
    },
    {
      title: 'Super Admin',
      items: [
        { icon: 'person-circle', label: 'School Admins', route: '/(phase4)/school-admins', roles: ['SUPER_ADMIN'], color: '#7C3AED' },
        { icon: 'diamond', label: 'Subscriptions', route: '/(phase4)/subscriptions', roles: ['SUPER_ADMIN'], color: '#F59E0B' },
      ],
    },
  ], []);

  const filteredSections = useMemo(() =>
    sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.roles || item.roles.includes(role)
        ),
      }))
      .filter((section) => section.items.length > 0),
    [sections, role]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Features</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item, iIdx) => (
                <TouchableOpacity
                  key={iIdx}
                  style={styles.menuCard}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: (item.color || '#e35336') + '20' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color || '#e35336'} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  content: { paddingBottom: 32 },
  section: { padding: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  iconContainer: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
