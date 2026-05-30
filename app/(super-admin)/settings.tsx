import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { superAdminApi } from '@/api';
import { unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';

export default function SuperAdminSettingsScreen() {
  const [settings, setSettings] = useState<any>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, maintenanceRes] = await Promise.allSettled([
        superAdminApi.platformSettings.get(),
        superAdminApi.platformSettings.getMaintenanceMode(),
      ]);
      if (settingsRes.status === 'fulfilled') setSettings(unwrapData(settingsRes.value, null));
      if (maintenanceRes.status === 'fulfilled') {
        const data = maintenanceRes.value.data?.data || maintenanceRes.value.data;
        setMaintenanceMode(data?.enabled || false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const toggleMaintenance = async () => {
    setToggling(true);
    try {
      await superAdminApi.platformSettings.setMaintenanceMode(!maintenanceMode);
      setMaintenanceMode(!maintenanceMode);
      Alert.alert('Success', `Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to toggle maintenance mode');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Platform Settings</Text>
        <Text style={styles.headerSubtext}>Manage global platform settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maintenance</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>When enabled, users will see a maintenance message</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, maintenanceMode ? styles.toggleActive : styles.toggleInactive]}
              onPress={toggleMaintenance}
              disabled={toggling}
            >
              {toggling ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.toggleText}>{maintenanceMode ? 'ON' : 'OFF'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {settings && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Info</Text>
          <View style={styles.settingCard}>
            {Object.entries(settings).map(([key, value]) => (
              <View key={key} style={styles.infoRow}>
                <Text style={styles.infoKey}>{key}</Text>
                <Text style={styles.infoValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  section: { padding: 16, paddingBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  settingCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#111827' },
  settingDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 60, alignItems: 'center' },
  toggleActive: { backgroundColor: '#EF4444' },
  toggleInactive: { backgroundColor: '#10B981' },
  toggleText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoKey: { fontSize: 13, color: '#6B7280', textTransform: 'capitalize' },
  infoValue: { fontSize: 13, fontWeight: '500', color: '#111827' },
});
