import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal as RNModal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  fullScreen?: boolean;
}

export function Modal({ visible, onClose, title, children, fullScreen }: ModalProps) {
  return (
    <RNModal visible={visible} animationType="slide" presentationStyle={fullScreen ? 'fullScreen' : 'pageSheet'} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.closeBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeBtn: { width: 40, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center' },
  content: { padding: 16, gap: 16 },
});
