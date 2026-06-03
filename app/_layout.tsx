import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-gesture-handler';

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const topSegment = segments[0];

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && user) {
      const targetRoute = ROLE_ROUTE_MAP[user.role];
      const isInCorrectGroup = targetRoute && topSegment === targetRoute.slice(2, -1);
      if (inAuthGroup) {
        router.replace(targetRoute || '/(teacher)');
      } else if (topSegment && !isInCorrectGroup && ROLE_ROUTE_MAP[user.role]) {
        router.replace(targetRoute);
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  return <>{children}</>;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(parent)" />
          <Stack.Screen name="(student)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="(registrar)" />
          <Stack.Screen name="(finance)" />
          <Stack.Screen name="(super-admin)" />
          <Stack.Screen name="(notifications)" />
          <Stack.Screen name="(phase4)" />
          <Stack.Screen name="(ai-agent)" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
