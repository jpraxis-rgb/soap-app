import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';
import { spacing } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  header?: string;
}

export function Card({ children, style, header }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {header && <Text style={styles.header}>{header}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
  },
  header: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
});
