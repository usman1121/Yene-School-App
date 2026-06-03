import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import api from '@/api/client';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { DisciplineIncident } from '@/types';

export default function DisciplineScreen() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<DisciplineIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await api.get('/discipline');
      setIncidents(unwrapArray<DisciplineIncident>(res));
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  }, [fetchIncidents]);

  const getSeverityStyle = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'LOW': return { bg: '#D1FAE5', text: '#065F46' };
      case 'MEDIUM': return { bg: '#FEF3C7', text: '#92400E' };
      case 'HIGH': return { bg: '#FED7AA', text: '#9A3412' };
      case 'CRITICAL': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'OPEN': return { bg: '#FEF3C7', text: '#92400E' };
      case 'INVESTIGATING': return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'RESOLVED': return { bg: '#D1FAE5', text: '#065F46' };
      case 'ESCALATED': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const formatDate = (date: string) => {
    try { return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return date; }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discipline</Text>
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {incidents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No discipline incidents</Text>
          </View>
        ) : (
          incidents.map((incident) => {
            const sev = getSeverityStyle(incident.severity);
            const stat = getStatusStyle(incident.status);
            return (
              <View key={incident.id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <Text style={styles.incidentTitle}>{incident.title}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[styles.severityText, { color: sev.text }]}>{incident.severity}</Text>
                  </View>
                </View>
                {incident.studentName && <Text style={styles.studentName}>Student: {incident.studentName}</Text>}
                {incident.description && <Text style={styles.description} numberOfLines={2}>{incident.description}</Text>}
                <View style={styles.incidentMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: stat.bg }]}>
                    <Text style={[styles.statusText, { color: stat.text }]}>{incident.status}</Text>
                  </View>
                  <Text style={styles.incidentDate}>{formatDate(incident.incidentDate || incident.createdAt)}</Text>
                </View>
                {incident.actionTaken && <Text style={styles.actionText}>Action: {incident.actionTaken}</Text>}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  incidentCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  incidentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incidentTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  severityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  studentName: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  description: { fontSize: 13, color: '#374151', marginTop: 4 },
  incidentMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.2 },
  incidentDate: { fontSize: 12, color: '#9CA3AF' },
  actionText: { fontSize: 12, color: '#374151', marginTop: 6, fontStyle: 'italic' },
});
