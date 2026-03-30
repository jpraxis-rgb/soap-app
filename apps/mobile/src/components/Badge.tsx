import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, typography, borderRadius, ThemeColors } from '../theme';

interface BadgeProps {
  text: string;
  color?: string;
}

export function Badge({ text, color }: BadgeProps) {
  const { colors } = useTheme();
  const badgeColor = color ?? colors.accent;
  const isWarning = badgeColor === colors.warning;
  const styles = createStyles(colors);
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text
        style={[
          styles.text,
          isWarning && { color: colors.background },
        ]}
        accessibilityLabel={text}
        maxFontSizeMultiplier={1.3}
      >
        {text}
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      alignSelf: 'flex-start',
    },
    text: {
      color: colors.text,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
    },
  });
