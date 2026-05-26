import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { timetableAPI } from '@/lib/api/teacher';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import type { TimetableSlot } from '@/types';

const WEEKDAYS = [
  { value: 1, name: 'Monday', short: 'Mon' },
  { value: 2, name: 'Tuesday', short: 'Tue' },
  { value: 3, name: 'Wednesday', short: 'Wed' },
  { value: 4, name: 'Thursday', short: 'Thu' },
  { value: 5, name: 'Friday', short: 'Fri' },
];

export default function TeacherTimetableScreen() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });

  const fetchTimetable = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await timetableAPI.getByTeacher(user.id);
      setTimetable(unwrapArray<TimetableSlot>(res));
    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const daySlots = timetable
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Timetable</Text>
        <Text style={styles.headerSubtext}>Your weekly teaching schedule</Text>
      </View>

      {/* Day Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {WEEKDAYS.map((day) => {
          const isActive = selectedDay === day.value;
          const count = timetable.filter((s) => s.dayOfWeek === day.value).length;
          return (
            <TouchableOpacity
              key={day.value}
              style={[styles.dayChip, isActive && styles.dayChipActive]}
              onPress={() => setSelectedDay(day.value)}
            >
              <Text style={[styles.dayShort, isActive && styles.dayShortActive]}>{day.short}</Text>
              <Text style={[styles.dayCount, isActive && styles.dayCountActive]}>{count}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Schedule */}
      <ScrollView style={styles.schedule}>
        {daySlots.length > 0 ? (
          daySlots.map((slot) => (
            <View key={slot.id} style={styles.slotCard}>
              <View style={styles.slotTime}>
                <View style={styles.timeDot} />
                <Text style={styles.timeText}>{formatTime(slot.startTime)}</Text>
                <Text style={styles.timeEnd}>to {formatTime(slot.endTime)}</Text>
              </View>
              <View style={styles.slotInfo}>
                <Text style={styles.slotSubject}>{slot.subject.name}</Text>
                <Text style={styles.slotClass}>
                  Class {slot.class.name} · Section {slot.section.name}
                </Text>
                <View style={styles.slotDetails}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.slotRoom}>Room {slot.room || 'TBD'}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              No classes on {WEEKDAYS.find((d) => d.value === selectedDay)?.name}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
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
  header: {
    padding: 16,
    paddingBottom: 8,
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
  daySelector: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dayChip: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    minWidth: 70,
  },
  dayChipActive: {
    backgroundColor: '#e35336',
    borderColor: '#e35336',
  },
  dayShort: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayShortActive: {
    color: '#FFFFFF',
  },
  dayCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e35336',
    marginTop: 4,
  },
  dayCountActive: {
    color: '#FFFFFF',
  },
  schedule: {
    flex: 1,
    paddingHorizontal: 16,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  slotTime: {
    width: 70,
    alignItems: 'center',
    marginRight: 12,
  },
  timeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e35336',
    marginBottom: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e35336',
  },
  timeEnd: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  slotInfo: {
    flex: 1,
  },
  slotSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  slotClass: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  slotDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  slotRoom: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
