import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

interface BellSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  bellType: string;
  daysActive: string[];
  isActive: boolean;
}

interface SirenEvent {
  id: string;
  type: string;
  triggeredAt: string;
  triggeredBy?: string;
  status: string;
}

interface SirenHardware {
  id: string;
  name: string;
  ipAddress?: string;
  port?: number;
  isConnected: boolean;
  deviceType?: string;
}

type TabType = 'schedules' | 'events' | 'hardware';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

const extractData = (res: any): any => {
  return res?.data?.data ?? res?.data ?? res ?? null;
};

export default function SchoolSirenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('schedules');
  const [schedules, setSchedules] = useState<BellSchedule[]>([]);
  const [events, setEvents] = useState<SirenEvent[]>([]);
  const [hardware, setHardware] = useState<SirenHardware | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [hardwareModal, setHardwareModal] = useState(false);
  const [testing, setTesting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingHardware, setSavingHardware] = useState(false);
  const [editSchedule, setEditSchedule] = useState<BellSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({ name: '', startTime: '', endTime: '', bellType: 'BELL', daysActive: [] as string[] });
  const [hardwareForm, setHardwareForm] = useState({ name: '', ipAddress: '', port: 80, deviceType: 'SIREN' });

  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  const fetchData = useCallback(async () => {
    try {
      if (activeTab === 'schedules') {
        const res = await api.get('/api/siren/schedules');
        setSchedules(extractList(res) as BellSchedule[]);
      } else if (activeTab === 'events') {
        const res = await api.get('/api/siren/events');
        setEvents(extractList(res) as SirenEvent[]);
      } else if (activeTab === 'hardware') {
        const res = await api.get('/api/siren/hardware');
        setHardware(extractData(res) as SirenHardware | null);
      }
    } catch (error) {
      console.error('Failed to fetch siren data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const saveSchedule = async () => {
    if (!scheduleForm.name || !scheduleForm.startTime || !scheduleForm.endTime || scheduleForm.daysActive.length === 0) {
      Alert.alert('Validation', 'Please fill all required fields');
      return;
    }
    setSavingSchedule(true);
    try {
      if (editSchedule) {
        await api.put(`/api/siren/schedules/${editSchedule.id}`, scheduleForm);
      } else {
        await api.post('/api/siren/schedules', scheduleForm);
      }
      setScheduleModal(false);
      setEditSchedule(null);
      setScheduleForm({ name: '', startTime: '', endTime: '', bellType: 'BELL', daysActive: [] });
      Alert.alert('Success', editSchedule ? 'Schedule updated' : 'Schedule created');
      fetchData();
    } catch (error) {
      Alert.alert('Error', 'Failed to save schedule');
    } finally {
      setSavingSchedule(false);
    }
  };

  const deleteSchedule = (id: string) => {
    Alert.alert('Delete Schedule', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/api/siren/schedules/${id}`);
          Alert.alert('Success', 'Schedule deleted');
          fetchData();
        } catch { Alert.alert('Error', 'Failed to delete schedule'); }
      }},
    ]);
  };

  const saveHardwareConfig = async () => {
    if (!hardwareForm.name) {
      Alert.alert('Validation', 'Device name is required');
      return;
    }
    setSavingHardware(true);
    try {
      await api.post('/api/siren/hardware', hardwareForm);
      setHardwareModal(false);
      fetchData();
      Alert.alert('Success', 'Hardware configuration saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save hardware config');
    } finally {
      setSavingHardware(false);
    }
  };

  const testHardware = async () => {
    setTesting(true);
    try {
      await api.post('/api/siren/hardware/test');
      Alert.alert('Success', 'Test signal sent');
    } catch {
      Alert.alert('Error', 'Hardware test failed');
    } finally {
      setTesting(false);
    }
  };

  const triggerSiren = async () => {
    Alert.alert('Trigger Siren', 'Manually trigger the siren?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Trigger', style: 'destructive', onPress: async () => {
        setTriggering(true);
        try {
          await api.post('/api/siren/trigger');
          Alert.alert('Success', 'Siren triggered');
        } catch {
          Alert.alert('Error', 'Failed to trigger siren');
        } finally {
          setTriggering(false);
        }
      }},
    ]);
  };

  const openEditSchedule = (schedule: BellSchedule) => {
    setEditSchedule(schedule);
    setScheduleForm({ name: schedule.name, startTime: schedule.startTime, endTime: schedule.endTime, bellType: schedule.bellType, daysActive: schedule.daysActive });
    setScheduleModal(true);
  };

  const toggleDay = (day: string) => {
    setScheduleForm((prev) => ({
      ...prev,
      daysActive: prev.daysActive.includes(day) ? prev.daysActive.filter((d) => d !== day) : [...prev.daysActive, day],
    }));
  };

  const formatTime = (date: string) => {
    try { return new Date(`2000-01-01T${date}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
    catch { return date; }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Siren</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabBar}>
        {(['schedules', 'events', 'hardware'] as TabType[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => { setActiveTab(tab); setLoading(true); }}>
            <Ionicons name={tab === 'schedules' ? 'timer-outline' : tab === 'events' ? 'list-outline' : 'hardware-chip-outline'} size={16} color={activeTab === tab ? '#e35336' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 40 }} />
        ) : activeTab === 'schedules' ? (
          <>
            <TouchableOpacity style={styles.addScheduleBtn} onPress={() => { setEditSchedule(null); setScheduleForm({ name: '', startTime: '', endTime: '', bellType: 'BELL', daysActive: [] }); setScheduleModal(true); }}>
              <Ionicons name="add-circle-outline" size={20} color="#e35336" />
              <Text style={styles.addScheduleText}>Add Schedule</Text>
            </TouchableOpacity>
            {schedules.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="timer-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No schedules configured</Text>
              </View>
            ) : (
              schedules.map((s) => (
                <View key={s.id} style={styles.scheduleCard}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleName}>{s.name}</Text>
                    <View style={styles.scheduleActions}>
                      <TouchableOpacity onPress={() => openEditSchedule(s)}>
                        <Ionicons name="create-outline" size={18} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteSchedule(s.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.scheduleTimes}>
                    <View style={styles.timeBlock}>
                      <Ionicons name="play" size={14} color="#10B981" />
                      <Text style={styles.timeText}>{formatTime(s.startTime)}</Text>
                    </View>
                    <Ionicons name="remove" size={14} color="#D1D5DB" />
                    <View style={styles.timeBlock}>
                      <Ionicons name="stop" size={14} color="#EF4444" />
                      <Text style={styles.timeText}>{formatTime(s.endTime)}</Text>
                    </View>
                  </View>
                  <View style={styles.scheduleMeta}>
                    <View style={styles.metaBadge}>
                      <Text style={styles.metaBadgeText}>{s.bellType}</Text>
                    </View>
                    <View style={styles.dayRow}>
                      {s.daysActive?.map((d) => (
                        <View key={d} style={styles.dayChip}>
                          <Text style={styles.dayChipText}>{d.slice(0, 3)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : activeTab === 'events' ? (
          events.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="list-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No events recorded</Text>
            </View>
          ) : (
            events.map((evt) => (
              <View key={evt.id} style={styles.eventCard}>
                <View style={styles.eventIcon}>
                  <Ionicons name="alarm" size={20} color="#EF4444" />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventType}>{evt.type}</Text>
                  <Text style={styles.eventDate}>{new Date(evt.triggeredAt).toLocaleString()}</Text>
                  {evt.triggeredBy && <Text style={styles.eventTriggeredBy}>by {evt.triggeredBy}</Text>}
                </View>
                <View style={[styles.eventStatus, { backgroundColor: evt.status === 'SUCCESS' ? '#D1FAE5' : '#FEF3C7' }]}>
                  <Text style={[styles.eventStatusText, { color: evt.status === 'SUCCESS' ? '#065F46' : '#92400E' }]}>{evt.status}</Text>
                </View>
              </View>
            ))
          )
        ) : (
          <View style={styles.hardwareSection}>
            {hardware ? (
              <View style={styles.hardwareCard}>
                <View style={styles.hardwareHeader}>
                  <View style={styles.hardwareIcon}>
                    <Ionicons name="hardware-chip" size={24} color="#e35336" />
                  </View>
                  <View style={styles.hardwareInfo}>
                    <Text style={styles.hardwareName}>{hardware.name}</Text>
                    <Text style={styles.hardwareType}>{hardware.deviceType}</Text>
                  </View>
                  <View style={[styles.connectionBadge, { backgroundColor: hardware.isConnected ? '#D1FAE5' : '#FEE2E2' }]}>
                    <Text style={[styles.connectionText, { color: hardware.isConnected ? '#065F46' : '#991B1B' }]}>{hardware.isConnected ? 'Connected' : 'Disconnected'}</Text>
                  </View>
                </View>
                {hardware.ipAddress && (
                  <Text style={styles.hardwareDetail}>IP: {hardware.ipAddress}:{hardware.port}</Text>
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="hardware-chip-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hardware configured</Text>
              </View>
            )}
            <TouchableOpacity style={styles.hardwareBtn} onPress={() => { setHardwareForm({ name: hardware?.name || '', ipAddress: hardware?.ipAddress || '', port: hardware?.port || 80, deviceType: hardware?.deviceType || 'SIREN' }); setHardwareModal(true); }}>
              <Ionicons name="settings-outline" size={18} color="#e35336" />
              <Text style={styles.hardwareBtnText}>Configure Hardware</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.hardwareBtn, testing && { opacity: 0.6 }]} onPress={testHardware} disabled={testing}>
              {testing ? <ActivityIndicator size="small" color="#e35336" /> : <Ionicons name="pulse-outline" size={18} color="#e35336" />}
              <Text style={styles.hardwareBtnText}>{testing ? 'Testing...' : 'Test Hardware'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.triggerBtn, triggering && { opacity: 0.6 }]} onPress={triggerSiren} disabled={triggering}>
              {triggering ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="alarm-outline" size={18} color="#FFFFFF" />}
              <Text style={styles.triggerBtnText}>{triggering ? 'Triggering...' : 'Manual Trigger'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={scheduleModal} animationType="slide" transparent onRequestClose={() => setScheduleModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editSchedule ? 'Edit Schedule' : 'New Schedule'}</Text>
            <TextInput style={styles.input} placeholder="Schedule Name" value={scheduleForm.name} onChangeText={(v) => setScheduleForm({ ...scheduleForm, name: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Start Time (HH:mm)" value={scheduleForm.startTime} onChangeText={(v) => setScheduleForm({ ...scheduleForm, startTime: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="End Time (HH:mm)" value={scheduleForm.endTime} onChangeText={(v) => setScheduleForm({ ...scheduleForm, endTime: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Bell Type (BELL, ALARM, etc)" value={scheduleForm.bellType} onChangeText={(v) => setScheduleForm({ ...scheduleForm, bellType: v })} placeholderTextColor="#9CA3AF" />
            <Text style={styles.modalLabel}>Active Days</Text>
            <View style={styles.dayPicker}>
              {DAYS.map((d) => (
                <TouchableOpacity key={d} style={[styles.dayOption, scheduleForm.daysActive.includes(d) && styles.dayOptionActive]} onPress={() => toggleDay(d)}>
                  <Text style={[styles.dayOptionText, scheduleForm.daysActive.includes(d) && styles.dayOptionTextActive]}>{d.slice(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setScheduleModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingSchedule && { opacity: 0.6 }]} onPress={saveSchedule} disabled={savingSchedule}>
                {savingSchedule ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>{editSchedule ? 'Update' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={hardwareModal} animationType="slide" transparent onRequestClose={() => setHardwareModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hardware Configuration</Text>
            <TextInput style={styles.input} placeholder="Device Name" value={hardwareForm.name} onChangeText={(v) => setHardwareForm({ ...hardwareForm, name: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="IP Address" value={hardwareForm.ipAddress} onChangeText={(v) => setHardwareForm({ ...hardwareForm, ipAddress: v })} placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Port" value={String(hardwareForm.port)} onChangeText={(v) => setHardwareForm({ ...hardwareForm, port: parseInt(v) || 80 })} keyboardType="numeric" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Device Type" value={hardwareForm.deviceType} onChangeText={(v) => setHardwareForm({ ...hardwareForm, deviceType: v })} placeholderTextColor="#9CA3AF" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setHardwareModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingHardware && { opacity: 0.6 }]} onPress={saveHardwareConfig} disabled={savingHardware}>
                {savingHardware ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#FEE2E2' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, gap: 12 },
  addScheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e35336', borderStyle: 'dashed' },
  addScheduleText: { fontSize: 14, fontWeight: '600', color: '#e35336' },
  scheduleCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  scheduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  scheduleActions: { flexDirection: 'row', gap: 12 },
  scheduleTimes: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  scheduleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F3F4F6' },
  metaBadgeText: { fontSize: 10, fontWeight: '600', color: '#6B7280' },
  dayRow: { flexDirection: 'row', gap: 4 },
  dayChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#FEE2E2' },
  dayChipText: { fontSize: 9, fontWeight: '700', color: '#e35336' },
  eventCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 },
  eventIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  eventInfo: { flex: 1 },
  eventType: { fontSize: 14, fontWeight: '600', color: '#111827' },
  eventDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  eventTriggeredBy: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  eventStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eventStatusText: { fontSize: 10, fontWeight: '700' },
  hardwareSection: { gap: 12 },
  hardwareCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  hardwareHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hardwareIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  hardwareInfo: { flex: 1 },
  hardwareName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  hardwareType: { fontSize: 12, color: '#6B7280' },
  connectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  connectionText: { fontSize: 11, fontWeight: '700' },
  hardwareDetail: { fontSize: 13, color: '#6B7280' },
  hardwareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e35336', backgroundColor: '#FFFFFF' },
  hardwareBtnText: { fontSize: 14, fontWeight: '600', color: '#e35336' },
  triggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: '#EF4444' },
  triggerBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 12, backgroundColor: '#F8FAFC' },
  dayPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  dayOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  dayOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  dayOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  dayOptionTextActive: { color: '#e35336' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
