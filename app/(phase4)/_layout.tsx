import { Stack } from 'expo-router';

export default function Phase4Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="messaging" />
      <Stack.Screen name="events" />
      <Stack.Screen name="discipline" />
      <Stack.Screen name="search" />
      <Stack.Screen name="bulk-upload" />
      <Stack.Screen name="exams" />
      <Stack.Screen name="report-cards" />
      <Stack.Screen name="communications" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
