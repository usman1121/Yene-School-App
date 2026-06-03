import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface Props {
  label: string;
  value: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral'; positive?: boolean };
}

export function KpiCard({ label, value, icon, color = colors.primary, trend }: Props) {
  return (
    <View style={styles.card}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
      )}
      <Text style={[styles.label, { marginTop: icon ? spacing.sm : 0 }]}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {trend && (
        <View style={styles.trendRow}>
          <Ionicons
            name={
              trend.direction === 'up'
                ? 'arrow-up'
                : trend.direction === 'down'
                ? 'arrow-down'
                : 'remove'
            }
            size={12}
            color={trend.positive ? colors.status.success : colors.status.error}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.positive ? colors.status.success : colors.status.error },
            ]}
          >
            {trend.value}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: '45%',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.kpi,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    ...typography.h1,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: spacing.xs,
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
