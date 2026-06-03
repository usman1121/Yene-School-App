import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HelpTopic {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    icon: 'person-circle',
    title: 'Account & Profile',
    description: 'Managing your account',
    items: [
      { question: 'How do I change my password?', answer: 'Go to Profile > Change Password. Enter your current password, then your new password twice and tap Update Password.' },
      { question: 'How do I update my profile?', answer: 'Go to Profile > tap the edit icon next to Profile Information. Update your name, email, or phone and tap Save Profile.' },
      { question: 'How do I change my language?', answer: 'Go to Profile > Preferences > Language. Tap your preferred language to switch.' },
    ],
  },
  {
    icon: 'calendar',
    title: 'Timetable & Scheduling',
    description: 'Managing your schedule',
    items: [
      { question: 'How do I view my timetable?', answer: 'Tap the Timetable tab in your dashboard to view your weekly schedule.' },
      { question: 'How do I view my child\'s timetable?', answer: 'As a parent, select your child from Children, then tap Timetable to view their schedule.' },
    ],
  },
  {
    icon: 'school',
    title: 'Grades & Academics',
    description: 'Understanding your grades',
    items: [
      { question: 'How do I view my grades?', answer: 'Students can tap the Grades tab to view scores for all subjects, including CA, Mid, and Final scores.' },
      { question: 'How do parents view grades?', answer: 'Parents can select a child from Children, then tap Grades to view their academic performance.' },
      { question: 'When are report cards published?', answer: 'Report cards are published by the school administration after the end of each term.' },
    ],
  },
  {
    icon: 'checkmark-circle',
    title: 'Attendance',
    description: 'Tracking attendance',
    items: [
      { question: 'How is attendance marked?', answer: 'Teachers mark attendance during class. Students and parents can view attendance records.' },
      { question: 'What do the attendance statuses mean?', answer: 'Present = attended, Absent = did not attend, Late = arrived after start, Excused = absent with valid reason.' },
    ],
  },
  {
    icon: 'cash',
    title: 'Fees & Payments',
    description: 'Managing fees and payments',
    items: [
      { question: 'How do I view my fee balance?', answer: 'Parents can select a child, then tap Fees to view the fee summary, due amounts, and payment history.' },
      { question: 'How do I record a payment?', answer: 'Finance users can go to Payments and tap Record Payment to log a new payment.' },
    ],
  },
  {
    icon: 'chatbubbles',
    title: 'Communication',
    description: 'Staying connected',
    items: [
      { question: 'How does the Communication Book work?', answer: 'The Communication Book allows teachers, admin, and parents to exchange messages regarding student progress and behavior.' },
      { question: 'How do I access Messages?', answer: 'Messages is available for teachers and admin users. Tap the Messages tab to view your conversations.' },
    ],
  },
];

export default function HelpCenterScreen() {
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help Center</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.introCard}>
          <Ionicons name="help-circle" size={48} color="#e35336" />
          <Text style={styles.introTitle}>How can we help you?</Text>
          <Text style={styles.introText}>Browse topics below to find answers to common questions.</Text>
        </View>

        {HELP_TOPICS.map((topic, index) => {
          const isExpanded = expandedTopic === index;
          return (
            <View key={index} style={styles.topicCard}>
              <TouchableOpacity
                style={styles.topicHeader}
                onPress={() => setExpandedTopic(isExpanded ? null : index)}
              >
                <View style={styles.topicIconContainer}>
                  <Ionicons name={topic.icon} size={24} color="#e35336" />
                </View>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.title}</Text>
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.topicItems}>
                  {topic.items.map((item, itemIndex) => {
                    const itemKey = `${index}-${itemIndex}`;
                    const itemExpanded = expandedItems.has(itemKey);
                    return (
                      <TouchableOpacity
                        key={itemIndex}
                        style={styles.faqItem}
                        onPress={() => toggleItem(itemKey)}
                      >
                        <View style={styles.faqHeader}>
                          <Ionicons
                            name={itemExpanded ? 'remove-circle' : 'add-circle'}
                            size={20}
                            color="#e35336"
                          />
                          <Text style={styles.faqQuestion}>{item.question}</Text>
                        </View>
                        {itemExpanded && (
                          <Text style={styles.faqAnswer}>{item.answer}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.contactCard}>
          <Ionicons name="mail" size={24} color="#e35336" />
          <View style={styles.contactInfo}>
            <Text style={styles.contactTitle}>Contact Support</Text>
            <Text style={styles.contactText}>Still need help? Get in touch with our support team.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollContent: { padding: 16, gap: 12 },
  introCard: { alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 4, gap: 8 },
  introTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  introText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
  topicCard: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  topicHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  topicIconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  topicInfo: { flex: 1 },
  topicTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  topicDescription: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  topicItems: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8 },
  faqItem: { paddingVertical: 10 },
  faqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  faqQuestion: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },
  faqAnswer: { fontSize: 14, color: '#6B7280', marginTop: 8, marginLeft: 28, lineHeight: 20 },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 12, marginTop: 4 },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  contactText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
