import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  roles?: string[];
  color?: string;
}

export default function Phase4HubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const role = user?.role || '';

  const menuItems: MenuItem[] = [
    { icon: 'chatbubbles', label: 'Messages', route: '/(phase4)/messaging', roles: ['TEACHER', 'ADMIN', 'IT_MANAGER', 'REGISTRAR', 'FINANCE'], color: '#3B82F6' },
    { icon: 'calendar', label: 'Events', route: '/(phase4)/events', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER', 'STUDENT', 'PARENT'], color: '#8B5CF6' },
    { icon: 'shield', label: 'Discipline', route: '/(phase4)/discipline', roles: ['ADMIN', 'IT_MANAGER', 'TEACHER'], color: '#EF4444' },
    { icon: 'search', label: 'Search', route: '/(phase4)/search', color: '#10B981' },
    { icon: 'cloud-upload', label: 'Bulk Upload', route: '/(phase4)/bulk-upload', roles: ['ADMIN', 'IT_MANAGER', 'REGISTRAR', 'FINANCE'], color: '#F59E0B' },
    { icon: 'document-text', label: 'Exams & Assessments', route: '/(phase4)/exams', roles: ['STUDENT', 'TEACHER', 'ADMIN'], color: '#EC4899' },
    { icon: 'newspaper', label: 'Report Cards', route: '/(phase4)/report-cards', roles: ['STUDENT', 'PARENT'], color: '#6366F1' },
    { icon: 'chatbubble-ellipses', label: 'Communication Book', route: '/(phase4)/communications', roles: ['TEACHER', 'ADMIN', 'PARENT'], color: '#14B8A6' },
    { icon: 'help-circle', label: 'Help Center', route: '/(phase4)/help', color: '#6B7280' },
  ];

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>More</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {visibleItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuCard}
            onPress={() => router.push(item.route as any)}
          >
            <View style={[styles.iconContainer, { backgroundColor: (item.color || '#e35336') + '20' }]}>
              <Ionicons name={item.icon} size={28} color={item.color || '#e35336'} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  menuCard: { width: '46%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#E2E8F0', marginHorizontal: '2%' },
  iconContainer: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
