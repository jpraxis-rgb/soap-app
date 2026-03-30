import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme, spacing, typography, borderRadius, ThemeColors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  header?: string;
}

export function Card({ children, style, header }: CardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View style={[styles.card, style]}>
      {header && <Text style={styles.header} accessibilityRole="header" maxFontSizeMultiplier={1.3}>{header}</Text>}
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
    },
    header: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      marginBottom: spacing.sm,
    },
  });
