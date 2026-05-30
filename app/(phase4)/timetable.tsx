import React from 'react';
import { View, Text } from 'react-native';
import { FeatureScreen } from '@/components/FeatureScreen';

export default function TimetableScreen() {
  return (
    <FeatureScreen
      title="Timetable"
      icon="time"
      iconColor="#14B8A6"
      description="Manage school timetables and class schedules"
    >
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
          This feature is coming soon. You can access the full version on the web app.
        </Text>
      </View>
    </FeatureScreen>
  );
}
