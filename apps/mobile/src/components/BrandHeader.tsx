import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, spacing } from '../theme';
import { Wordmark } from './Logo';

/** Small Estuda Tudo wordmark used as a lightweight app-bar across the main tabs. */
export function BrandHeader() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Wordmark size={18} color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
});
