import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'draft' | 'submitted' | 'published';

interface Props {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.chip.defaultBg, text: colors.chip.defaultText },
  success: { bg: colors.status.successBg, text: colors.status.successText },
  warning: { bg: colors.status.warningBg, text: colors.status.warningText },
  error: { bg: colors.status.errorBg, text: colors.status.errorText },
  info: { bg: colors.status.infoBg, text: colors.status.infoText },
  draft: { bg: colors.badge.draftBg, text: colors.badge.draftText },
  submitted: { bg: colors.badge.submittedBg, text: colors.badge.submittedText },
  published: { bg: colors.badge.publishedBg, text: colors.badge.publishedText },
};

export function Badge({ label, variant = 'default', size = 'sm', style }: Props) {
  const v = variantStyles[variant];

  return (
    <View style={[styles.base, { backgroundColor: v.bg }, size === 'md' && styles.md, style]}>
      <Text style={[styles.text, { color: v.text }, size === 'md' && styles.textMd]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.small,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textMd: {
    ...typography.captionBold,
  },
});
