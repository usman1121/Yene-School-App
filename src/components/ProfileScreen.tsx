import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api/auth';
import { unwrapData } from '@/lib/api/utils';
import { storage } from '@/lib/storage';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'Amharic' },
  { code: 'om', label: 'Oromo' },
  { code: 'so', label: 'Somali' },
  { code: 'ar', label: 'Arabic' },
];

const THEMES = [
  { code: 'SYSTEM', label: 'System' },
  { code: 'LIGHT', label: 'Light' },
  { code: 'DARK', label: 'Dark' },
];

export function ProfileScreen({ fallbackInitial = 'U' }: { fallbackInitial?: string }) {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<any>(user);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState(user?.theme || 'SYSTEM');

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      const data = unwrapData<any>(res, res.data);
      setProfile(data);
      setForm({ name: data?.name || '', email: data?.email || '', phone: data?.phone || '' });
      setTheme(data?.theme || user?.theme || 'SYSTEM');
      if (data?.id) updateUser({ ...user, ...data });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [updateUser, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    storage.getItem('language').then((savedLanguage) => {
      if (savedLanguage) setLanguage(savedLanguage);
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    if (form.name.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      const data = unwrapData<any>(res, res.data);
      setProfile(data);
      updateUser({ ...user, ...data });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Fill all password fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await userAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const saveLanguage = async (nextLanguage: string) => {
    setLanguage(nextLanguage);
    await storage.setItem('language', nextLanguage);
  };

  const saveTheme = async (nextTheme: string) => {
    setTheme(nextTheme as any);
    await storage.setItem('theme', nextTheme);
    try {
      const res = await userAPI.updateTheme(nextTheme);
      const data = unwrapData<any>(res, null);
      if (data?.id) {
        setProfile(data);
        updateUser({ ...user, ...data, theme: nextTheme as any });
      } else if (user) {
        updateUser({ ...user, theme: nextTheme as any });
      }
    } catch (error) {
      console.error('Failed to sync theme preference:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const displayUser = profile || user;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{displayUser?.name?.charAt(0)?.toUpperCase() || fallbackInitial}</Text>
        </View>
        <Text style={styles.name}>{displayUser?.name || 'User'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{displayUser?.role || user?.role}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing((value) => !value)}>
            <Ionicons name={editing ? 'close' : 'create-outline'} size={18} color="#e35336" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Field label="Name" value={form.name} editable={editing} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />
          <Field label="Email" value={form.email} editable={editing} onChangeText={(email) => setForm((prev) => ({ ...prev, email }))} />
          <Field label="Phone" value={form.phone} editable={editing} onChangeText={(phone) => setForm((prev) => ({ ...prev, phone }))} />
        </View>

        {editing && (
          <TouchableOpacity style={[styles.primaryButton, saving && styles.disabledButton]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Save Profile</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Change Password</Text>
        <View style={styles.infoCard}>
          <Field label="Current Password" value={passwordForm.currentPassword} secure editable onChangeText={(currentPassword) => setPasswordForm((prev) => ({ ...prev, currentPassword }))} />
          <Field label="New Password" value={passwordForm.newPassword} secure editable onChangeText={(newPassword) => setPasswordForm((prev) => ({ ...prev, newPassword }))} />
          <Field label="Confirm Password" value={passwordForm.confirmPassword} secure editable onChangeText={(confirmPassword) => setPasswordForm((prev) => ({ ...prev, confirmPassword }))} />
        </View>
        <TouchableOpacity style={[styles.primaryButton, saving && styles.disabledButton]} onPress={changePassword} disabled={saving}>
          <Text style={styles.primaryButtonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.infoCard}>
          <View style={styles.preferenceBlock}>
            <Text style={styles.infoLabel}>Language</Text>
            <View style={styles.optionWrap}>
              {LANGUAGES.map((item) => {
                const active = language === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => saveLanguage(item.code)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.preferenceBlock}>
            <Text style={styles.infoLabel}>Theme</Text>
            <View style={styles.optionWrap}>
              {THEMES.map((item) => {
                const active = theme === item.code;
                return (
                  <TouchableOpacity
                    key={item.code}
                    style={[styles.optionChip, active && styles.optionChipActive]}
                    onPress={() => saveTheme(item.code)}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  editable,
  secure,
  onChangeText,
}: {
  label: string;
  value: string;
  editable: boolean;
  secure?: boolean;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.infoLabel}>{label}</Text>
      <TextInput
        style={[styles.input, !editable && styles.inputReadonly]}
        value={value}
        editable={editable}
        secureTextEntry={secure}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 32, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#111827' },
  roleText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  section: { padding: 20, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 },
  editButton: { padding: 8, borderRadius: 10, backgroundColor: '#FEE2E2' },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  field: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  preferenceBlock: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 6 },
  input: { fontSize: 15, color: '#111827', paddingVertical: 6 },
  inputReadonly: { color: '#374151' },
  primaryButton: { marginTop: 12, backgroundColor: '#e35336', padding: 14, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  optionChipActive: { borderColor: '#e35336', backgroundColor: '#e35336' },
  optionText: { color: '#374151', fontSize: 13, fontWeight: '500' },
  optionTextActive: { color: '#FFFFFF' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', padding: 16, borderRadius: 12, gap: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
