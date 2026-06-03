import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authAPI } from '@/lib/api/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter your username');
      return;
    }
    setIsLoading(true);
    try {
      await authAPI.requestPasswordReset(username.trim());
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to send reset request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SMS</Text>
          </View>
          <Text style={styles.brand}>Forgot Password</Text>
          <Text style={styles.subtitle}>Enter your username to receive a password reset link</Text>
        </View>

        {sent ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            <Text style={styles.successTitle}>Request Sent</Text>
            <Text style={styles.successMessage}>If the username exists, a password reset link has been sent.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, (isLoading || !username.trim()) && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.footer} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.footerText}>Remember your password? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  backButton: { alignSelf: 'flex-start', marginBottom: 16, padding: 4 },
  logoContainer: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#e35336', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  brand: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  form: { gap: 16 },
  inputContainer: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827', backgroundColor: '#F9FAFB' },
  loginButton: { backgroundColor: '#e35336', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  successContainer: { alignItems: 'center', gap: 16, marginBottom: 24 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  successMessage: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#e35336', fontWeight: '500' },
});
