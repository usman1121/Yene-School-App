import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { userAPI } from '@/lib/api/auth';
import { unwrapData } from '@/lib/api/utils';
import { storage } from '@/lib/storage';
import { languages } from '@/i18n';

const THEMES = [
  { code: 'SYSTEM', labelKey: 'system' },
  { code: 'LIGHT', labelKey: 'light' },
  { code: 'DARK', labelKey: 'dark' },
] as const;

export function ProfileScreen({ fallbackInitial = 'U' }: { fallbackInitial?: string }) {
  const { user, updateUser, logout } = useAuth();
  const { colors, mode, setMode, isDark } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState<any>(user);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userAPI.getProfile();
      const data = unwrapData<any>(res, res.data);
      setProfile(data);
      setForm({ name: data?.name || '', email: data?.email || '', phone: data?.phone || '' });
      if (data?.id) updateUser({ ...user, ...data });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const saveProfile = async () => {
    if (form.name.trim().length < 2) { Alert.alert('Error', 'Name must be at least 2 characters'); return; }
    setSaving(true);
    try {
      const res = await userAPI.updateProfile({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      const data = unwrapData<any>(res, res.data);
      setProfile(data);
      updateUser({ ...user, ...data });
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Fill all password fields'); return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      await userAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const displayUser = profile || user;

  const s = makeStyles(colors);

  if (loading) {
    return <View style={[s.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
        <View style={[s.avatar, { backgroundColor: colors.avatar.bg }]}>
          <Text style={[s.avatarText, { color: colors.avatar.text }]}>{displayUser?.name?.charAt(0)?.toUpperCase() || fallbackInitial}</Text>
        </View>
        <Text style={[s.name, { color: colors.text.primary }]}>{displayUser?.name || 'User'}</Text>
        <View style={[s.roleBadge, { backgroundColor: colors.text.primary }]}>
          <Text style={[s.roleText, { color: colors.text.inverse }]}>{displayUser?.role || user?.role}</Text>
        </View>
      </View>

      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.text.secondary }]}>Profile Information</Text>
          <TouchableOpacity style={[s.editButton, { backgroundColor: colors.primaryLight }]} onPress={() => setEditing((v) => !v)}>
            <Ionicons name={editing ? 'close' : 'create-outline'} size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={[s.infoCard, { backgroundColor: colors.card.bg, borderColor: colors.card.border }]}>
          <Field label="Name" value={form.name} editable={editing} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} colors={colors} />
          <Field label="Email" value={form.email} editable={editing} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} colors={colors} />
          <Field label="Phone" value={form.phone} editable={editing} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} colors={colors} />
        </View>
        {editing && (
          <TouchableOpacity style={[s.primaryButton, { backgroundColor: colors.primary }, saving && { opacity: 0.65 }]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryButtonText}>Save Profile</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.text.secondary }]}>Change Password</Text>
        <View style={[s.infoCard, { backgroundColor: colors.card.bg, borderColor: colors.card.border }]}>
          <Field label="Current Password" value={passwordForm.currentPassword} secure editable onChangeText={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))} colors={colors} />
          <Field label="New Password" value={passwordForm.newPassword} secure editable onChangeText={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))} colors={colors} />
          <Field label="Confirm Password" value={passwordForm.confirmPassword} secure editable onChangeText={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))} colors={colors} />
        </View>
        <TouchableOpacity style={[s.primaryButton, { backgroundColor: colors.primary }, saving && { opacity: 0.65 }]} onPress={changePassword} disabled={saving}>
          <Text style={s.primaryButtonText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={[s.sectionTitle, { color: colors.text.secondary }]}>Preferences</Text>
        <View style={[s.infoCard, { backgroundColor: colors.card.bg, borderColor: colors.card.border }]}>
          <View style={[s.preferenceBlock, { borderBottomColor: colors.borderLight }]}>
            <Text style={[s.infoLabel, { color: colors.text.muted }]}>Language</Text>
            <View style={s.optionWrap}>
              {languages.map((lang) => {
                const active = language === lang.code;
                return (
                  <TouchableOpacity key={lang.code} style={[s.optionChip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setLanguage(lang.code)}>
                    <Text style={[s.optionText, { color: colors.text.secondary }, active && { color: colors.text.inverse }]}>{lang.nativeLabel}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View style={s.preferenceBlock}>
            <Text style={[s.infoLabel, { color: colors.text.muted }]}>Theme</Text>
            <View style={s.optionWrap}>
              {THEMES.map((item) => {
                const active = mode === item.code;
                return (
                  <TouchableOpacity key={item.code} style={[s.optionChip, { backgroundColor: colors.surface, borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setMode(item.code)}>
                    <Text style={[s.optionText, { color: colors.text.secondary }, active && { color: colors.text.inverse }]}>{(t.settings as any)[item.labelKey]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={s.section}>
        <TouchableOpacity style={[s.logoutButton, { backgroundColor: colors.status.error }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ label, value, editable, secure, onChangeText, colors }: { label: string; value: string; editable: boolean; secure?: boolean; onChangeText: (v: string) => void; colors: any }) {
  const s = makeStyles(colors);
  return (
    <View style={[s.field, { borderBottomColor: colors.borderLight }]}>
      <Text style={[s.infoLabel, { color: colors.text.muted }]}>{label}</Text>
      <TextInput style={[s.input, { color: colors.text.primary }, !editable && { color: colors.text.secondary }]} value={value} editable={editable} secureTextEntry={secure} placeholder={label} placeholderTextColor={colors.input.placeholder} onChangeText={onChangeText} autoCapitalize="none" />
    </View>
  );
}

const makeStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 32, borderBottomWidth: 1 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  roleBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 14, fontWeight: '600' },
  section: { padding: 20, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  editButton: { padding: 8, borderRadius: 10 },
  infoCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  field: { padding: 14, borderBottomWidth: 1 },
  preferenceBlock: { padding: 14, borderBottomWidth: 1 },
  infoLabel: { fontSize: 12, marginBottom: 6 },
  input: { fontSize: 15, paddingVertical: 6 },
  primaryButton: { marginTop: 12, padding: 14, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  optionChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  optionText: { fontSize: 13, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8 },
  logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
