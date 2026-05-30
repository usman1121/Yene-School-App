import { View, ViewProps, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';

interface Props extends ViewProps {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ onPress, padded = true, style, children, ...rest }: Props) {
  const content = (
    <View style={[styles.card, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.bg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.card.border,
    shadowColor: colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  padded: {
    padding: spacing.lg,
  },
});
