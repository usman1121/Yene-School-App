import { View, ViewProps, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { colors } from '@/theme';

interface Props extends ViewProps {
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScreenContainer({ scroll, refreshing, onRefresh, style, children, ...rest }: Props) {
  if (scroll) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, style as any]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
        }
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, styles.fixedContent, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  fixedContent: {
    padding: 16,
  },
});
