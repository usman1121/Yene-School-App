import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface PeriodTime {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: string;
  sequence?: number;
}

export default function PeriodTimesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [periods, setPeriods] = useState<PeriodTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<PeriodTime | null>(null);
  const [formName, setFormName] = useState('');
  const [formStartTime, setFormStartTime] = useState('');
  const [formEndTime, setFormEndTime] = useState('');
  const [formType, setFormType] = useState('REGULAR');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/api/period-time');
      const data = res.data?.data || res.data || [];
      setPeriods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load period times:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const openCreate = () => {
    setEditItem(null);
    setFormName('');
    setFormStartTime('');
    setFormEndTime('');
    setFormType('REGULAR');
    setModalVisible(true);
  };

  const openEdit = (item: PeriodTime) => {
    setEditItem(item);
    setFormName(item.name);
    setFormStartTime(item.startTime);
    setFormEndTime(item.endTime);
    setFormType(item.type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formStartTime.trim() || !formEndTime.trim()) {
      Alert.alert('Error', 'Name, start time, and end time are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: formName.trim(), startTime: formStartTime.trim(), endTime: formEndTime.trim(), type: formType };
      if (editItem) {
        await api.put(`/api/period-time/${editItem.id}`, payload);
      } else {
        await api.post('/api/period-time', payload);
      }
      setModalVisible(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save period time.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: PeriodTime) => {
    Alert.alert('Delete', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/api/period-time/${item.id}`);
            await fetchData();
          } catch {
            Alert.alert('Error', 'Failed to delete period time.');
          }
        },
      },
    ]);
  };

  const typeColors: Record<string, string> = {
    REGULAR: '#3B82F6',
    BREAK: '#F59E0B',
    LUNCH: '#10B981',
    ASSEMBLY: '#8B5CF6',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Period Times</Text>
        <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
        ) : periods.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No period times configured</Text>
          </View>
        ) : (
          periods.map((item, index) => (
            <View key={item.id || String(index)} style={styles.periodCard}>
              <View style={styles.periodHeader}>
                <View style={styles.periodLeft}>
                  <View style={[styles.typeBadge, { backgroundColor: (typeColors[item.type] || '#6B7280') + '20' }]}>
                    <Text style={[styles.typeText, { color: typeColors[item.type] || '#6B7280' }]}>{item.type}</Text>
                  </View>
                  <Text style={styles.periodName}>{item.name}</Text>
                </View>
                <View style={styles.periodActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Ionicons name="create-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                  <Ionicons name="play" size={14} color="#10B981" />
                  <Text style={styles.timeText}>{item.startTime}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#D1D5DB" />
                <View style={styles.timeBlock}>
                  <Ionicons name="stop" size={14} color="#EF4444" />
                  <Text style={styles.timeText}>{item.endTime}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editItem ? 'Edit Period Time' : 'New Period Time'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Period Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Period 1, Morning Break"
                placeholderTextColor="#9CA3AF"
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.fieldLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 08:00 AM"
                placeholderTextColor="#9CA3AF"
                value={formStartTime}
                onChangeText={setFormStartTime}
              />

              <Text style={styles.fieldLabel}>End Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 08:45 AM"
                placeholderTextColor="#9CA3AF"
                value={formEndTime}
                onChangeText={setFormEndTime}
              />

              <Text style={styles.fieldLabel}>Type</Text>
              <View style={styles.pickerRow}>
                {['REGULAR', 'BREAK', 'LUNCH', 'ASSEMBLY'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.pickerOption, formType === t && styles.pickerOptionActive]}
                    onPress={() => setFormType(t)}
                  >
                    <Text style={[styles.pickerOptionText, formType === t && styles.pickerOptionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                  {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>{editItem ? 'Update' : 'Create'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  periodCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  periodLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  periodName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  periodActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalScroll: { maxHeight: '85%' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', marginBottom: 14, backgroundColor: '#F8FAFC' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerOptionActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerOptionText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pickerOptionTextActive: { color: '#e35336' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#e35336', alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
