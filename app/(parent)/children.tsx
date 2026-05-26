import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { childrenAPI } from '@/lib/api/parent';
import { normalizeChild, unwrapArray } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Child } from '@/types';

export default function ChildrenScreen() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChildren = useCallback(async () => {
    try {
      const res = await childrenAPI.getMyChildren();
      setChildren(unwrapArray(res).map((child) => normalizeChild(child)));
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const renderChild = ({ item }: { item: Child }) => (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() =>
        router.push({
          pathname: '/(parent)/[childId]',
          params: { childId: item.userId || item.id, name: item.name },
        })
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{item.name}</Text>
        <Text style={styles.childClass}>
          Grade {item.className} · Section {item.section}
        </Text>
        <Text style={styles.childCode}>{item.studentCode}</Text>
        {item.homeroomTeacher?.name && (
          <Text style={styles.childCode}>Teacher: {item.homeroomTeacher.name}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Children</Text>
        <Text style={styles.headerSubtext}>
          {children.length} child{children.length !== 1 ? 'ren' : ''}
        </Text>
      </View>

      <FlatList
        data={children}
        keyExtractor={(item) => item.id}
        renderItem={renderChild}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No children found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e35336',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  childClass: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  childCode: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});
