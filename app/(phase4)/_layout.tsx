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
      <Stack.Screen name="announcements" />
      <Stack.Screen name="exam-seating" />
      <Stack.Screen name="entry-progress" />
      <Stack.Screen name="publish-results" />
      <Stack.Screen name="performance-brief" />
      <Stack.Screen name="data-health" />
      <Stack.Screen name="certificate-template" />
      <Stack.Screen name="student-admission" />
      <Stack.Screen name="student-promotion" />
      <Stack.Screen name="student-rankings" />
      <Stack.Screen name="id-cards" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="parents" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="assign-teachers" />
      <Stack.Screen name="period-times" />
      <Stack.Screen name="admin-attendance" />
      <Stack.Screen name="credentials" />
      <Stack.Screen name="school-settings" />
      <Stack.Screen name="siren" />
      <Stack.Screen name="finance-reports" />
      <Stack.Screen name="school-admins" />
      <Stack.Screen name="subscriptions" />
    </Stack>
  );
}
