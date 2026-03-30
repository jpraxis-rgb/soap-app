import React, { ReactNode } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
} from 'react-native';
import { useTheme, spacing, typography, borderRadius, ThemeColors } from '../theme';

type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined';
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
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
  variant = 'filled',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { paddingVertical, paddingHorizontal, fontSize } = sizeConfig[size];

  const isFilled = variant === 'filled';

  const content = loading ? (
    <ActivityIndicator color={isFilled ? colors.accentForeground : colors.accent} />
  ) : (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text
        style={[
          styles.label,
          { fontSize },
          isFilled && { color: colors.accentForeground },
          !isFilled && { color: colors.accent },
        ]}
        maxFontSizeMultiplier={1.3}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.base,
        { paddingVertical, paddingHorizontal },
        isFilled && { backgroundColor: colors.accent },
        !isFilled && styles.outlined,
        style,
        (loading || disabled) && { opacity: 0.5 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: loading || disabled }}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      fontWeight: typography.weights.semibold,
    },
  });
