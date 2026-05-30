import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import api from '@/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get('/search', { params: { q: query.trim() } });
      setResults(res.data?.data || res.data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const hasResults = results && Object.values(results).some((v: any) => Array.isArray(v) && v.length > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search students, teachers, classes..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={loading || !query.trim()}>
          {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="search" size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsList}>
        {searched && !hasResults && !loading && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        )}

        {results && Object.entries(results).map(([category, items]: [string, any]) => {
          if (!Array.isArray(items) || items.length === 0) return null;
          return (
            <View key={category} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{category}</Text>
              {items.slice(0, 5).map((item: any, index: number) => (
                <View key={item.id || index} style={styles.resultCard}>
                  <Text style={styles.resultName}>{item.name || item.title || item.label || 'Unknown'}</Text>
                  {item.email && <Text style={styles.resultDetail}>{item.email}</Text>}
                  {item.code && <Text style={styles.resultDetail}>Code: {item.code}</Text>}
                </View>
              ))}
              {items.length > 5 && (
                <Text style={styles.moreText}>+{items.length - 5} more</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 16 },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  searchBtn: { backgroundColor: '#e35336', padding: 12, borderRadius: 10 },
  resultsList: { flex: 1, paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  categorySection: { marginBottom: 16 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'capitalize' },
  resultCard: { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 6 },
  resultName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  resultDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  moreText: { fontSize: 12, color: '#e35336', fontWeight: '500', marginTop: 4, textAlign: 'center' },
});
