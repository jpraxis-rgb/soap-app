import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, ThemeColors } from '../theme';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';

const TIER_ORDER = ['free', 'registro', 'microlearning', 'mentor'];

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuito',
  registro: 'Registro',
  microlearning: 'Microlearning',
  mentor: 'Mentor',
};

interface RequireTierProps {
  tier: string;
  children: ReactNode;
  onUpgrade?: () => void;
}

export function RequireTier({ tier, children, onUpgrade }: RequireTierProps) {
  const { colors } = useTheme();
  const { subscriptionTier } = useAuth();
  const styles = createStyles(colors);

  const currentLevel = TIER_ORDER.indexOf(subscriptionTier);
  const requiredLevel = TIER_ORDER.indexOf(tier);

  if (currentLevel >= requiredLevel) {
    return <>{children}</>;
  }

  const requiredLabel = TIER_LABELS[tier] || tier;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name="lock-closed" size={32} color={colors.text} />
      </LinearGradient>

      <Text style={styles.title}>Conteudo Premium</Text>
      <Text style={styles.description}>
        Este conteudo requer o plano {requiredLabel} ou superior.
      </Text>

      <Button
        label={`Assinar ${requiredLabel}`}
        onPress={onUpgrade || (() => {})}
        style={styles.button}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    description: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    },
    button: {
      width: '100%',
    },
  });
