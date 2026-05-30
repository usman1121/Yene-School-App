import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { notificationsApi } from '@/api';
import { unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Notification } from '@/types';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.allSettled([
        notificationsApi.getAll({ limit: 50 }),
        notificationsApi.getUnreadCount(),
      ]);
      if (notifRes.status === 'fulfilled') setNotifications(unwrapArray<Notification>(notifRes.value));
      if (countRes.status === 'fulfilled') setUnreadCount(countRes.value.data?.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return dateString; }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'grade': return 'school';
      case 'attendance': return 'calendar';
      case 'payment': return 'cash';
      case 'fee': return 'wallet';
      case 'announcement': return 'megaphone';
      case 'exam': return 'document-text';
      case 'discipline': return 'warning';
      default: return 'notifications';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtext}>{unreadCount} unread</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.list} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}>
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          notifications.map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.isRead && styles.unread]}
              onPress={() => !notif.isRead && handleMarkRead(notif.id)}
            >
              <View style={[styles.notifIcon, !notif.isRead ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name={getIcon(notif.type)} size={20} color={!notif.isRead ? '#e35336' : '#6B7280'} />
              </View>
              <View style={styles.notifInfo}>
                <Text style={[styles.notifTitle, !notif.isRead && styles.unreadText]}>{notif.title}</Text>
                <Text style={styles.notifMessage} numberOfLines={2}>{notif.message || notif.body}</Text>
                <Text style={styles.notifTime}>{formatTime(notif.createdAt)}</Text>
              </View>
              {!notif.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
  backBtn: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  headerSubtext: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  markAllBtn: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#e35336' },
  list: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  unread: { borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  unreadText: { color: '#e35336' },
  notifMessage: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  notifTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e35336', marginTop: 4 },
});
