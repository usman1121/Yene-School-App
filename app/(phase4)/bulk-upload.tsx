import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import api from '@/lib/api/core';
import { useAuth } from '@/contexts/AuthContext';

const UPLOAD_TYPES = [
  { key: 'students', label: 'Students', icon: 'people', desc: 'Upload student records via CSV/Excel', endpoint: '/bulk-upload/students' },
  { key: 'teachers', label: 'Teachers', icon: 'school', desc: 'Upload teacher records', endpoint: '/bulk-upload/staff' },
  { key: 'grades', label: 'Grades', icon: 'create', desc: 'Bulk upload grades from spreadsheet', endpoint: '/bulk-upload/grades' },
  { key: 'fees', label: 'Fee Structures', icon: 'wallet', desc: 'Import fee structures', endpoint: '/bulk-upload/fees' },
];

export default function BulkUploadScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleUpload = useCallback((type: { key: string; label: string; endpoint: string }) => {
    Alert.alert(
      `Upload ${type.label}`,
      'Select a file (CSV or Excel format) to upload. Make sure your file matches the required template format.',
      [
        { text: 'Choose File', onPress: () => performUpload(type) },
        { text: 'Download Template First', onPress: () => handleDownloadTemplate(type.key) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  const performUpload = async (type: { key: string; label: string; endpoint: string }) => {
    setUploading(type.key);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: 'file://placeholder',
        name: `${type.key}.csv`,
        type: 'text/csv',
      } as any);
      formData.append('type', type.key);

      const res = await api.post(type.endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const msg = res.data?.message || `${type.label} uploaded successfully.`;
      Alert.alert('Upload Complete', msg);
    } catch (error: any) {
      const msg = error?.response?.data?.message || `Failed to upload ${type.label}. Please ensure the file is correctly formatted and try again.`;
      Alert.alert('Upload Failed', msg);
    } finally {
      setUploading(null);
    }
  };

  const handleDownloadTemplate = async (type: string) => {
    setDownloading(type);
    try {
      const res = await api.get('/bulk-upload/template', {
        params: { type },
        responseType: 'blob',
      });
      Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} template downloaded. Check your downloads folder.`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || `Failed to download ${type} template.`;
      Alert.alert('Download Failed', msg);
    } finally {
      setDownloading(null);
    }
  };

  const handleGenerateCredentials = useCallback(() => {
    Alert.alert(
      'Generate Credentials',
      'Generate login credentials for all users who do not have them yet. This will create usernames and temporary passwords.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate All',
          onPress: async () => {
            try {
              const res = await api.post('/bulk-upload/generate-credentials');
              const count = res.data?.count || res.data?.generated || 0;
              Alert.alert('Credentials Generated', `Credentials generated for ${count} user(s). Check the credentials list for details.`);
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to generate credentials.');
            }
          },
        },
      ]
    );
  }, []);

  const handleSendCredentials = useCallback(() => {
    Alert.alert(
      'Send Credentials',
      'Send login credentials (username & password) to all users who have been generated but not yet notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send All',
          onPress: async () => {
            try {
              const res = await api.post('/bulk-upload/send-credentials');
              const count = res.data?.count || res.data?.sent || 0;
              Alert.alert('Credentials Sent', `Credentials sent to ${count} user(s).`);
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.message || 'Failed to send credentials.');
            }
          },
        },
      ]
    );
  }, []);

  const canManage = user && ['ADMIN', 'IT_MANAGER', 'SUPER_ADMIN'].includes(user.role);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulk Upload</Text>
      </View>

      <ScrollView style={styles.list}>
        <Text style={styles.description}>
          Upload data in bulk using CSV or Excel files. Download templates below.
        </Text>

        {UPLOAD_TYPES.map((type) => (
          <TouchableOpacity
            key={type.key}
            style={styles.uploadCard}
            onPress={() => handleUpload(type)}
            disabled={uploading === type.key}
          >
            <View style={[styles.uploadIcon, { backgroundColor: '#FEE2E2' }]}>
              {uploading === type.key ? (
                <ActivityIndicator size="small" color="#e35336" />
              ) : (
                <Ionicons name={type.icon as any} size={24} color="#e35336" />
              )}
            </View>
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadLabel}>{type.label}</Text>
              <Text style={styles.uploadDesc}>{type.desc}</Text>
            </View>
            <Ionicons name="cloud-upload-outline" size={20} color="#e35336" />
          </TouchableOpacity>
        ))}

        <View style={styles.templateSection}>
          <Text style={styles.templateTitle}>Download Templates</Text>
          {UPLOAD_TYPES.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={styles.templateBtn}
              onPress={() => handleDownloadTemplate(type.key)}
              disabled={downloading === type.key}
            >
              {downloading === type.key ? (
                <ActivityIndicator size="small" color="#e35336" />
              ) : (
                <Ionicons name="download-outline" size={16} color="#e35336" />
              )}
              <Text style={styles.templateText}>{type.label} Template</Text>
            </TouchableOpacity>
          ))}
        </View>

        {canManage && (
          <View style={styles.credSection}>
            <Text style={styles.templateTitle}>Credentials Management</Text>
            <TouchableOpacity style={styles.credBtn} onPress={handleGenerateCredentials}>
              <Ionicons name="key-outline" size={18} color="#e35336" />
              <Text style={styles.credBtnText}>Generate Missing Credentials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.credBtn} onPress={handleSendCredentials}>
              <Ionicons name="send-outline" size={18} color="#e35336" />
              <Text style={styles.credBtnText}>Send Credentials to Users</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  list: { flex: 1, paddingHorizontal: 16 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  uploadCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10 },
  uploadIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  uploadInfo: { flex: 1 },
  uploadLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  uploadDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  templateSection: { marginTop: 16, marginBottom: 8 },
  templateTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  templateText: { fontSize: 14, color: '#e35336', fontWeight: '500', marginLeft: 4 },
  credSection: { marginTop: 20 },
  credBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  credBtnText: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
