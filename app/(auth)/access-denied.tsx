import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

const ROLE_ROUTE_MAP: Record<string, string> = {
  TEACHER: '/(teacher)',
  STUDENT: '/(student)',
  PARENT: '/(parent)',
  ADMIN: '/(admin)',
  REGISTRAR: '/(registrar)',
  FINANCE: '/(finance)',
  SUPER_ADMIN: '/(super-admin)',
  IT_MANAGER: '/(admin)',
};

export default function AccessDeniedScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed" size={80} color="#EF4444" />
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.message}>You do not have permission to access this page.</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (user) {
            router.replace(ROLE_ROUTE_MAP[user.role] || '/(teacher)');
          } else {
            router.replace('/(auth)/login');
          }
        }}
      >
        <Text style={styles.buttonText}>Go to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  message: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  button: { backgroundColor: '#e35336', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
