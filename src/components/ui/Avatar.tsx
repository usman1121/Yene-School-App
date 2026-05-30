import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, borderRadius } from '@/theme';

interface Props {
  name: string;
  size?: number;
  uri?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, size = 40, uri }: Props) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.skeleton,
  },
  fallback: {
    backgroundColor: colors.avatar.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.avatar.text,
    ...typography.bodyBold,
  },
});
