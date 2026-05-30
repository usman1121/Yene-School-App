import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  type?: string;
  createdAt: string;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/events', { params: { month: selectedMonth + 1, year: new Date().getFullYear() } });
      const data = res.data?.data || res.data || [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      day: d.getDate(),
      month: d.toLocaleString('en-US', { month: 'short' }),
      full: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    };
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.monthPicker}>
      {months.map((m, i) => (
        <TouchableOpacity key={i} style={[styles.monthTab, selectedMonth === i && styles.activeMonth]} onPress={() => setSelectedMonth(i)}>
          <Text style={[styles.monthText, selectedMonth === i && styles.activeMonthText]}>{m}</Text>
        </TouchableOpacity>
      ))}
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const fd = formatDate(item.date);
          return (
            <View style={styles.eventCard}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateDay}>{fd.day}</Text>
                <Text style={styles.dateMonth}>{fd.month}</Text>
              </View>
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                {item.description && <Text style={styles.eventDesc} numberOfLines={2}>{item.description}</Text>}
                <View style={styles.eventMeta}>
                  {item.location && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.metaText}>{item.location}</Text>
                    </View>
                  )}
                  {item.type && (
                    <View style={styles.metaRow}>
                      <Ionicons name="pricetag-outline" size={12} color="#9CA3AF" />
                      <Text style={styles.metaText}>{item.type}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} /> : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No events scheduled</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  monthPicker: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, gap: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  monthTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  activeMonth: { backgroundColor: '#e35336' },
  monthText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  activeMonthText: { color: '#FFFFFF' },
  listContent: { padding: 16, gap: 12 },
  eventCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 14 },
  dateBlock: { width: 50, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#FEE2E2', borderRadius: 10 },
  dateDay: { fontSize: 20, fontWeight: '700', color: '#e35336' },
  dateMonth: { fontSize: 12, fontWeight: '600', color: '#C73B1E' },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  eventDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  eventMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#9CA3AF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
});
