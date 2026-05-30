import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const UPLOAD_TYPES = [
  { key: 'students', label: 'Students', icon: 'people', desc: 'Upload student records via CSV/Excel' },
  { key: 'teachers', label: 'Teachers', icon: 'school', desc: 'Upload teacher records' },
  { key: 'grades', label: 'Grades', icon: 'create', desc: 'Bulk upload grades from spreadsheet' },
  { key: 'fees', label: 'Fee Structures', icon: 'wallet', desc: 'Import fee structures' },
];

export default function BulkUploadScreen() {
  const router = useRouter();

  const handleUpload = (type: string) => {
    Alert.alert('Upload', `Upload functionality for ${type} will be available soon.`);
  };

  return (
    <View style={styles.container}>
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
          <TouchableOpacity key={type.key} style={styles.uploadCard} onPress={() => handleUpload(type.key)}>
            <View style={[styles.uploadIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name={type.icon as any} size={24} color="#e35336" />
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
          <TouchableOpacity style={styles.templateBtn}>
            <Ionicons name="download-outline" size={16} color="#e35336" />
            <Text style={styles.templateText}>Students Template</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.templateBtn}>
            <Ionicons name="download-outline" size={16} color="#e35336" />
            <Text style={styles.templateText}>Grades Template</Text>
          </TouchableOpacity>
        </View>
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
  templateSection: { marginTop: 16, marginBottom: 32 },
  templateTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  templateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  templateText: { fontSize: 14, color: '#e35336', fontWeight: '500' },
});
