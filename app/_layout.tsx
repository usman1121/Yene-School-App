import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useRouter, useSegments } from 'expo-router';
import 'react-native-gesture-handler';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTeacherGroup = segments[0] === '(teacher)';
    const inParentGroup = segments[0] === '(parent)';
    const inRoleGroup = inTeacherGroup || inParentGroup;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && user) {
      const isParent = user.role === 'PARENT';
      if (inAuthGroup) {
        router.replace(isParent ? '/(parent)' : '/(teacher)');
      } else if (inRoleGroup) {
        if (isParent && !inParentGroup) {
          router.replace('/(parent)');
        } else if (!isParent && !inTeacherGroup) {
          router.replace('/(teacher)');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(teacher)" />
          <Stack.Screen name="(parent)" />
        </Stack>
      </AuthGate>
    </AuthProvider>
  );
}
