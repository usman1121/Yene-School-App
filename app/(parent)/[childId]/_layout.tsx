import { Stack, useLocalSearchParams } from 'expo-router';

export default function ChildDetailLayout() {
  const { name } = useLocalSearchParams();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: (name as string) || 'Child',
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#111827',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Overview' }} />
      <Stack.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Stack.Screen name="grades" options={{ title: 'Grades' }} />
      <Stack.Screen name="fees" options={{ title: 'Fees' }} />
      <Stack.Screen name="timetable" options={{ title: 'Timetable' }} />
    </Stack>
  );
}
