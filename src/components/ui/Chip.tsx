import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active, onPress, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.active, style]}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.chip.defaultBg,
    borderWidth: 1,
    borderColor: colors.chip.defaultBorder,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.xs + 2,
  },
  active: {
    backgroundColor: colors.chip.activeBg,
    borderColor: colors.chip.activeBg,
  },
  label: {
    ...typography.captionBold,
    color: colors.chip.defaultText,
  },
  activeLabel: {
    color: colors.chip.activeText,
  },
});
