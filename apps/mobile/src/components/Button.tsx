import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, borderRadius } from '../theme';

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'gradient' | 'outlined';
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  style?: ViewStyle;
}

const sizeConfig: Record<ButtonSize, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: typography.sizes.sm },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: typography.sizes.md },
  lg: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl, fontSize: typography.sizes.lg },
};

export function Button({
  label,
  onPress,
  variant = 'gradient',
  size = 'md',
  icon,
  loading = false,
  style,
}: ButtonProps) {
  const { paddingVertical, paddingHorizontal, fontSize } = sizeConfig[size];

  const content = loading ? (
    <ActivityIndicator color={variant === 'gradient' ? colors.text : colors.accent} />
  ) : (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text
        style={[
          styles.label,
          { fontSize },
          variant === 'outlined' && { color: colors.accent },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Pressable onPress={onPress} disabled={loading} style={style}>
        <LinearGradient
          colors={[colors.accent, colors.accentPink]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, { paddingVertical, paddingHorizontal }]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.base, styles.outlined, { paddingVertical, paddingHorizontal }, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: spacing.sm,
  },
  label: {
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
});
