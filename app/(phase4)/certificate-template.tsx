import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';

interface TemplateConfig {
  id: string;
  schoolNameDisplay: boolean;
  logoPosition: 'left' | 'center' | 'right';
  headerText: string;
  footerText: string;
  showGrade: boolean;
  showSubjects: boolean;
  primaryColor: string;
  accentColor: string;
  watermarkUrl?: string;
}

const COLOR_OPTIONS = ['#e35336', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#4F46E5'];

export default function CertificateTemplateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [template, setTemplate] = useState<TemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'accent' | null>(null);

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await api.get('/report-cards/certificate-template');
      const data = res.data?.data || res.data;
      setTemplate(data);
    } catch (err) {
      console.error('Failed to load template:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTemplate(); }, [fetchTemplate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTemplate();
    setRefreshing(false);
  }, [fetchTemplate]);

  const updateField = (key: keyof TemplateConfig, value: any) => {
    if (!template) return;
    setTemplate({ ...template, [key]: value });
  };

  const handleSave = async () => {
    if (!template) return;
    setSaving(true);
    try {
      await api.put('/report-cards/certificate-template', template);
      Alert.alert('Saved', 'Certificate template updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadWatermark = async () => {
    Alert.alert(
      'Upload Watermark',
      'Select a PNG image to use as watermark on certificates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: async () => {
            try {
              const formData = new FormData();
              formData.append('watermark', {
                uri: 'file:///placeholder',
                name: 'watermark.png',
                type: 'image/png',
              } as any);
              const res = await api.post('/report-cards/certificate-template/watermark', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
              });
              Alert.alert('Success', res.data?.message || 'Watermark uploaded.');
              fetchTemplate();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Upload failed.');
            }
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    Alert.alert('Preview', 'Enter a report card ID to preview the certificate:');
  };

  const toggleOption = (key: 'schoolNameDisplay' | 'showGrade' | 'showSubjects') => {
    if (!template) return;
    updateField(key, !template[key]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificate Template</Text>
          <View style={styles.backBtn} />
        </View>
        <ActivityIndicator size="large" color="#e35336" style={{ marginTop: 60 }} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Certificate Template</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#e35336" />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e35336']} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Options</Text>

          <TouchableOpacity style={styles.toggleRow} onPress={() => toggleOption('schoolNameDisplay')}>
            <Text style={styles.toggleLabel}>Show School Name</Text>
            <Ionicons name={template?.schoolNameDisplay ? 'checkbox' : 'square-outline'} size={22} color={template?.schoolNameDisplay ? '#e35336' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleRow} onPress={() => toggleOption('showGrade')}>
            <Text style={styles.toggleLabel}>Show Grade</Text>
            <Ionicons name={template?.showGrade ? 'checkbox' : 'square-outline'} size={22} color={template?.showGrade ? '#e35336' : '#9CA3AF'} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleRow} onPress={() => toggleOption('showSubjects')}>
            <Text style={styles.toggleLabel}>Show Subjects</Text>
            <Ionicons name={template?.showSubjects ? 'checkbox' : 'square-outline'} size={22} color={template?.showSubjects ? '#e35336' : '#9CA3AF'} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logo Position</Text>
          <View style={styles.radioRow}>
            {(['left', 'center', 'right'] as const).map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.radioBtn, template?.logoPosition === pos && styles.radioActive]}
                onPress={() => updateField('logoPosition', pos)}
              >
                <Text style={[styles.radioText, template?.logoPosition === pos && styles.radioTextActive]}>
                  {pos.charAt(0).toUpperCase() + pos.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Fields</Text>
          <Text style={styles.inputLabel}>Header Text</Text>
          <TextInput
            style={styles.input}
            value={template?.headerText || ''}
            onChangeText={(v) => updateField('headerText', v)}
            placeholder="e.g. Certificate of Completion"
          />
          <Text style={styles.inputLabel}>Footer Text</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={template?.footerText || ''}
            onChangeText={(v) => updateField('footerText', v)}
            placeholder="e.g. Congratulations on your achievement!"
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template Colors</Text>
          <Text style={styles.inputLabel}>Primary Color</Text>
          <TouchableOpacity style={styles.colorPreview} onPress={() => setShowColorPicker('primary')}>
            <View style={[styles.colorSwatch, { backgroundColor: template?.primaryColor || '#e35336' }]} />
            <Text style={styles.colorValue}>{template?.primaryColor || '#e35336'}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
          {showColorPicker === 'primary' && (
            <View style={styles.colorPicker}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, template?.primaryColor === c && styles.colorOptionActive]}
                  onPress={() => { updateField('primaryColor', c); setShowColorPicker(null); }}
                />
              ))}
            </View>
          )}

          <Text style={styles.inputLabel}>Accent Color</Text>
          <TouchableOpacity style={styles.colorPreview} onPress={() => setShowColorPicker('accent')}>
            <View style={[styles.colorSwatch, { backgroundColor: template?.accentColor || '#2563EB' }]} />
            <Text style={styles.colorValue}>{template?.accentColor || '#2563EB'}</Text>
            <Ionicons name="chevron-down" size={18} color="#6B7280" />
          </TouchableOpacity>
          {showColorPicker === 'accent' && (
            <View style={styles.colorPicker}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, template?.accentColor === c && styles.colorOptionActive]}
                  onPress={() => { updateField('accentColor', c); setShowColorPicker(null); }}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watermark</Text>
          <TouchableOpacity style={styles.watermarkBtn} onPress={handleUploadWatermark}>
            <Ionicons name="image-outline" size={20} color="#e35336" />
            <Text style={styles.watermarkText}>
              {template?.watermarkUrl ? 'Change Watermark' : 'Upload Watermark'}
            </Text>
          </TouchableOpacity>
          {template?.watermarkUrl && (
            <Text style={styles.watermarkHint}>Watermark image is set</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePreview}>
            <Ionicons name="eye-outline" size={18} color="#e35336" />
            <Text style={styles.actionText}>Preview Certificate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={18} color="#6B7280" />
            <Text style={[styles.actionText, { color: '#6B7280' }]}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  saveBtn: { fontSize: 15, fontWeight: '600', color: '#e35336' },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  toggleLabel: { fontSize: 14, color: '#374151' },
  radioRow: { flexDirection: 'row', gap: 8 },
  radioBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  radioActive: { borderColor: '#e35336', backgroundColor: '#FEE2E2' },
  radioText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  radioTextActive: { color: '#e35336' },
  inputLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827', backgroundColor: '#F9FAFB' },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  colorPreview: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, backgroundColor: '#F9FAFB' },
  colorSwatch: { width: 24, height: 24, borderRadius: 6, marginRight: 10 },
  colorValue: { flex: 1, fontSize: 13, color: '#374151' },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorOptionActive: { borderWidth: 3, borderColor: '#111827' },
  watermarkBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  watermarkText: { fontSize: 14, color: '#e35336', fontWeight: '500' },
  watermarkHint: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  actionText: { fontSize: 14, color: '#e35336', fontWeight: '500' },
});
