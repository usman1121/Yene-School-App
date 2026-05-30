import React from 'react';
import { View, Text } from 'react-native';
import { FeatureScreen } from '@/components/FeatureScreen';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentAdmissionScreen() {
  const { user } = useAuth();
  return (
    <FeatureScreen
      title="Student Admission"
      icon="person-add"
      iconColor="#2563EB"
      description="Process new student enrollments and admissions"
    >
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
          This feature is coming soon. You can access the full version on the web app.
        </Text>
      </View>
    </FeatureScreen>
  );
}
