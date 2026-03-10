import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';

interface BadgeProps {
  text: string;
  color?: string;
}

export function Badge({ text, color = colors.accent }: BadgeProps) {
  const isWarning = color === colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text
        style={[
          styles.text,
          isWarning && { color: colors.background },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
