import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/api/client';

const extractList = (res: any): any[] => {
  const d = res?.data?.data || res?.data || res || [];
  return Array.isArray(d) ? d : [];
};

interface Plan {
  id: string;
  name: string;
  tier: string;
  price: number;
  features: string[];
  isActive?: boolean;
  createdAt: string;
}

interface SchoolSubscription {
  schoolId: string;
  schoolName: string;
  planId: string;
  planName: string;
  tier: string;
  status: string;
}

interface UnassignedSchool {
  id: string;
  name: string;
  code?: string;
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'plans' | 'assignments'>('plans');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schools, setSchools] = useState<SchoolSubscription[]>([]);
  const [unassignedSchools, setUnassignedSchools] = useState<UnassignedSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [formName, setFormName] = useState('');
  const [formTier, setFormTier] = useState('CORE');
  const [formPrice, setFormPrice] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSchoolId, setAssignSchoolId] = useState('');
  const [assignPlanId, setAssignPlanId] = useState('');

  const fetchPlans = useCallback(async () => {
    const res = await api.get('/subscription/plans');
    setPlans(extractList(res) as Plan[]);
  }, []);

  const fetchSchools = useCallback(async () => {
    const res = await api.get('/subscription/schools');
    setSchools(extractList(res) as SchoolSubscription[]);
  }, []);

  const fetchUnassignedSchools = useCallback(async () => {
    try {
      const res = await api.get('/subscription/unassigned-schools');
      setUnassignedSchools(extractList(res) as UnassignedSchool[]);
    } catch {
      setUnassignedSchools([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPlans(), fetchSchools(), fetchUnassignedSchools()]);
    } catch (e) {
      console.error('Failed to load subscription data:', e);
    } finally {
      setLoading(false);
    }
  }, [fetchPlans, fetchSchools, fetchUnassignedSchools]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPlans(), fetchSchools(), fetchUnassignedSchools()]);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const openCreate = () => {
    setEditPlan(null);
    setFormName('');
    setFormTier('CORE');
    setFormPrice('');
    setFormFeatures('');
    setShowModal(true);
  };

  const openEdit = (plan: Plan) => {
    setEditPlan(plan);
    setFormName(plan.name);
    setFormTier(plan.tier);
    setFormPrice(String(plan.price));
    setFormFeatures(Array.isArray(plan.features) ? plan.features.join('\n') : '');
    setShowModal(true);
  };

  const savePlan = async () => {
    if (!formName.trim() || !formPrice.trim()) { Alert.alert('Error', 'Name and price are required.'); return; }
    setActionLoading(true);
    try {
      const data = {
        name: formName.trim(),
        tier: formTier,
        price: parseFloat(formPrice),
        features: formFeatures.split('\n').map(f => f.trim()).filter(Boolean),
      };
      if (editPlan) {
        await api.put(`/subscription/plans/${editPlan.id}`, data);
      } else {
        await api.post('/subscription/plans', data);
      }
      Alert.alert('Success', editPlan ? 'Plan updated.' : 'Plan created.');
      setShowModal(false);
      await fetchPlans();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to save plan.');
    } finally { setActionLoading(false); }
  };

  const deletePlan = (plan: Plan) => {
    Alert.alert('Delete Plan', `Delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/subscription/plans/${plan.id}`);
          Alert.alert('Success', 'Plan deleted.');
          await fetchPlans();
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Delete failed.'); }
      }},
    ]);
  };

  const openAssign = () => {
    setAssignSchoolId('');
    setAssignPlanId('');
    setShowAssignModal(true);
  };

  const assignPlan = async () => {
    if (!assignSchoolId || !assignPlanId) {
      Alert.alert('Error', 'Select both a school and a plan.');
      return;
    }
    setActionLoading(true);
    try {
      await api.post('/subscription/assign', { schoolId: assignSchoolId, planId: assignPlanId });
      Alert.alert('Success', 'Plan assigned.');
      setShowAssignModal(false);
      await Promise.all([fetchSchools(), fetchUnassignedSchools()]);
    } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Assignment failed.'); }
    finally { setActionLoading(false); }
  };

  const removeAssignment = (schoolId: string) => {
    Alert.alert('Remove Assignment', 'Remove this plan assignment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/subscription/assign/${schoolId}`);
          Alert.alert('Success', 'Assignment removed.');
          await Promise.all([fetchSchools(), fetchUnassignedSchools()]);
        } catch (e: any) { Alert.alert('Error', e?.response?.data?.message || 'Remove failed.'); }
      }},
    ]);
  };

  const tierColors: Record<string, string> = { CORE: '#6B7280', STANDARD: '#3B82F6', ULTIMATE: '#F59E0B' };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Subscriptions</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Subscriptions</Text>
        <TouchableOpacity onPress={tab === 'plans' ? openCreate : openAssign} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#e35336" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'plans' && styles.activeTab]} onPress={() => setTab('plans')}>
          <Text style={[styles.tabText, tab === 'plans' && styles.activeTabText]}>Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'assignments' && styles.activeTab]} onPress={() => setTab('assignments')}>
          <Text style={[styles.tabText, tab === 'assignments' && styles.activeTabText]}>Assignments</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {tab === 'plans' ? (
          plans.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Plans</Text>
              <Text style={styles.emptyText}>Create your first subscription plan.</Text>
            </View>
          ) : (
            plans.map(plan => (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: (tierColors[plan.tier] || '#6B7280') + '20' }]}>
                    <Text style={[styles.tierText, { color: tierColors[plan.tier] || '#6B7280' }]}>{plan.tier}</Text>
                  </View>
                  <View style={styles.planActions}>
                    <TouchableOpacity onPress={() => openEdit(plan)}><Ionicons name="create-outline" size={18} color="#6B7280" /></TouchableOpacity>
                    <TouchableOpacity onPress={() => deletePlan(plan)}><Ionicons name="trash-outline" size={18} color="#EF4444" /></TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>${plan.price}<Text style={styles.planPricePeriod}>/month</Text></Text>
                {Array.isArray(plan.features) && plan.features.length > 0 && (
                  <View style={styles.featureList}>
                    {plan.features.map((f, i) => (
                      <View key={i} style={styles.featureRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                        <Text style={styles.featureText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )
        ) : (
          <>
            {schools.length === 0 && unassignedSchools.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Assignments</Text>
                <Text style={styles.emptyText}>No schools have been assigned plans yet.</Text>
              </View>
            ) : (
              <>
                {unassignedSchools.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderTitle}>Unassigned Schools</Text>
                    <Text style={styles.sectionHeaderCount}>{unassignedSchools.length}</Text>
                  </View>
                )}
                {unassignedSchools.map(s => (
                  <View key={s.id} style={styles.unassignedCard}>
                    <View style={styles.schoolInfo}>
                      <Text style={styles.schoolName}>{s.name}</Text>
                      {s.code && <Text style={styles.schoolCode}>{s.code}</Text>}
                    </View>
                    <TouchableOpacity style={styles.assignBtn} onPress={() => { setAssignSchoolId(s.id); setAssignPlanId(''); setShowAssignModal(true); }}>
                      <Text style={styles.assignBtnText}>Assign</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {schools.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderTitle}>Assigned Schools</Text>
                    <Text style={styles.sectionHeaderCount}>{schools.length}</Text>
                  </View>
                )}
                {schools.map(s => (
                  <View key={s.schoolId} style={styles.schoolCard}>
                    <View style={styles.schoolInfo}>
                      <Text style={styles.schoolName}>{s.schoolName}</Text>
                      <View style={[styles.tierBadge, { backgroundColor: (tierColors[s.tier] || '#6B7280') + '20', alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={[styles.tierText, { color: tierColors[s.tier] || '#6B7280' }]}>{s.planName || s.tier}</Text>
                      </View>
                    </View>
                    <View style={styles.schoolRight}>
                      <View style={[styles.statusBadge, { backgroundColor: s.status === 'ACTIVE' ? '#D1FAE5' : '#FEF3C7' }]}>
                        <Text style={[styles.statusText, { color: s.status === 'ACTIVE' ? '#065F46' : '#92400E' }]}>{s.status}</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeAssignment(s.schoolId)} style={styles.removeBtn}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editPlan ? 'Edit Plan' : 'New Plan'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <TextInput style={styles.input} placeholder="Plan name" value={formName} onChangeText={setFormName} placeholderTextColor="#9CA3AF" />
              <View style={styles.tierSelector}>
                {['CORE', 'STANDARD', 'ULTIMATE'].map(t => (
                  <TouchableOpacity key={t} style={[styles.tierOption, formTier === t && styles.tierOptionActive]} onPress={() => setFormTier(t)}>
                    <Text style={[styles.tierOptionText, formTier === t && styles.tierOptionTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={styles.input} placeholder="Price (e.g. 99)" value={formPrice} onChangeText={setFormPrice} keyboardType="decimal-pad" placeholderTextColor="#9CA3AF" />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Features (one per line)" value={formFeatures} onChangeText={setFormFeatures} multiline placeholderTextColor="#9CA3AF" />
              <TouchableOpacity style={styles.saveBtn} onPress={savePlan} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>{editPlan ? 'Update' : 'Create'} Plan</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Plan</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 14 }}>
              <Text style={styles.fieldLabel}>School</Text>
              <View style={styles.pickerRow}>
                {[...unassignedSchools, ...schools.map(s => ({ id: s.schoolId, name: s.schoolName }))].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i).map(s => (
                  <TouchableOpacity key={s.id} style={[styles.pickerChip, assignSchoolId === s.id && styles.pickerChipActive]} onPress={() => setAssignSchoolId(s.id)}>
                    <Text style={[styles.pickerChipText, assignSchoolId === s.id && styles.pickerChipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.fieldLabel}>Plan</Text>
              <View style={styles.pickerRow}>
                {plans.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.pickerChip, assignPlanId === p.id && styles.pickerChipActive]} onPress={() => setAssignPlanId(p.id)}>
                    <Text style={[styles.pickerChipText, assignPlanId === p.id && styles.pickerChipTextActive]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveBtn} onPress={assignPlan} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Assign Plan</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#e35336' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#e35336' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, marginTop: 8 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#374151' },
  sectionHeaderCount: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
  planCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 10 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tierText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  planActions: { flexDirection: 'row', gap: 12 },
  planName: { fontSize: 18, fontWeight: '700', color: '#111827' },
  planPrice: { fontSize: 24, fontWeight: '800', color: '#e35336', marginTop: 4 },
  planPricePeriod: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  featureList: { marginTop: 12, gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: '#374151' },
  unassignedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FEFCE8', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  schoolCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 8 },
  schoolInfo: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  schoolCode: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  schoolRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  assignBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#e35336' },
  assignBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  removeBtn: { padding: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 4 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, fontSize: 15, color: '#111827' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  tierSelector: { flexDirection: 'row', gap: 8 },
  tierOption: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tierOptionActive: { borderColor: '#e35336', backgroundColor: '#FEF2F2' },
  tierOptionText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tierOptionTextActive: { color: '#e35336' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  pickerChipActive: { backgroundColor: '#FEE2E2', borderColor: '#e35336' },
  pickerChipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  pickerChipTextActive: { color: '#e35336' },
  saveBtn: { backgroundColor: '#e35336', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
