import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  showNotifications?: boolean;
  showAi?: boolean;
  showMenu?: boolean;
  onMenuPress?: () => void;
}

export function DashboardHeader({
  title,
  subtitle,
  showNotifications = true,
  showAi = true,
  showMenu = false,
  onMenuPress,
}: DashboardHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const canAccessPhase4 = user && !['STUDENT', 'PARENT'].includes(user.role);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerTop}>
        {showMenu ? (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
            <Ionicons name="menu" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtn} />
        )}

        <View>
          <Text style={styles.greeting}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.headerActions}>
          {showAi && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(ai-agent)')}>
              <Ionicons name="sparkles" size={22} color="#e35336" />
            </TouchableOpacity>
          )}
          {showNotifications && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(notifications)')}>
              <Ionicons name="notifications-outline" size={22} color="#111827" />
            </TouchableOpacity>
          )}
          {canAccessPhase4 && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(phase4)')}>
              <Ionicons name="ellipsis-horizontal-circle" size={22} color="#111827" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#FFFFFF', paddingBottom: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});
