import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { parentFinanceAPI } from '@/lib/api/parent';
import { unwrapData } from '@/lib/api/utils';
import { Ionicons } from '@expo/vector-icons';

export default function ChildFeesScreen() {
  const { childId } = useLocalSearchParams();
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFees = useCallback(async () => {
    try {
      const res = await parentFinanceAPI.getChildFees(childId as string, '', '');
      setFeeData(unwrapData(res, res.data));
    } catch (error) {
      console.error('Failed to fetch fees:', error);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const formatBirr = (amount: number) => `${Math.round(amount).toLocaleString()} Br`;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e35336" />
      </View>
    );
  }

  const summary = feeData?.summary || feeData || {};
  const totalDue = summary.totalFees || summary.totalDue || summary.amount || 0;
  const totalPaid = summary.totalPaid || 0;
  const balance = summary.totalBalance || summary.balance || summary.totalDueBalance || 0;
  const feeItems = feeData?.feeItems || feeData?.items || feeData?.fees || [];
  const payments = feeData?.payments || feeData?.paymentHistory || [];

  return (
    <ScrollView style={styles.container}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Fees</Text>
          <Text style={styles.summaryValue}>{formatBirr(totalDue)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Paid</Text>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formatBirr(totalPaid)}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={[styles.balanceValue, balance > 0 ? { color: '#F59E0B' } : { color: '#10B981' }]}>
            {formatBirr(balance)}
          </Text>
        </View>
        {balance > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.alertText}>Payment due</Text>
          </View>
        )}
        {balance === 0 && totalDue > 0 && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.successText}>Fully paid</Text>
          </View>
        )}
      </View>

      {/* Fee Items */}
      {feeItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Items</Text>
          {feeItems.map((item: any, index: number) => (
            <View key={index} style={styles.feeItemCard}>
              <Text style={styles.feeItemName}>{item.name || item.description || 'Fee'}</Text>
              <Text style={styles.feeItemAmount}>{formatBirr(item.amount || 0)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.map((payment: any, index: number) => (
            <View key={index} style={styles.paymentCard}>
              <View style={styles.paymentIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatBirr(payment.amount || 0)}</Text>
                <Text style={styles.paymentDate}>
                  {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={[styles.paymentMethod, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.paymentMethodText, { color: '#065F46' }]}>
                  {payment.method || 'Cash'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {feeItems.length === 0 && payments.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="cash-outline" size={48} color="#D1D5DB" />
          <Text style={styles.emptyText}>No fee records</Text>
        </View>
      )}
    </ScrollView>
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
  summaryCard: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  alertText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
  },
  successText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '500',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  feeItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  feeItemName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  feeItemAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e35336',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  paymentIcon: {
    marginRight: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  paymentMethod: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '600',
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
