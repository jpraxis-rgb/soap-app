import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Button } from '../components';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  features: PlanFeature[];
  recommended: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Básico',
    price: 'R$ 19,90',
    period: '/mês',
    features: [
      { text: 'Upload de editais', included: true },
      { text: 'Cronograma inteligente', included: true },
      { text: 'Acompanhamento de progresso', included: true },
      { text: 'Resumos e mapas mentais', included: false },
      { text: 'Flashcards com repetição espaçada', included: false },
      { text: 'Quizzes por tópico', included: false },
      { text: 'Conteúdo curado por professores', included: false },
    ],
    recommended: false,
  },
  {
    name: 'Microlearning',
    price: 'R$ 39,90',
    period: '/mês',
    features: [
      { text: 'Upload de editais', included: true },
      { text: 'Cronograma inteligente', included: true },
      { text: 'Acompanhamento de progresso', included: true },
      { text: 'Resumos e mapas mentais', included: true },
      { text: 'Flashcards com repetição espaçada', included: true },
      { text: 'Quizzes por tópico', included: true },
      { text: 'Conteúdo curado por professores', included: true },
    ],
    recommended: true,
  },
];

export function PaywallScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();

  function handleSubscribe(_plan: Plan) {
    // In production: initiate payment flow
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Desbloqueie todo{'\n'}o potencial</Text>
          <Text style={styles.headerSubtitle}>
            Escolha o plano ideal para sua preparação
          </Text>
        </View>

        {/* Plans */}
        {PLANS.map((plan, index) => (
          <View
            key={index}
            style={[
              styles.planCard,
              plan.recommended && styles.planCardRecommended,
            ]}
          >
            {plan.recommended && (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recommendedBadge}
              >
                <Text style={styles.recommendedText}>RECOMENDADO</Text>
              </LinearGradient>
            )}

            <Text style={styles.planName}>{plan.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, fIndex) => (
                <View key={fIndex} style={styles.featureRow}>
                  <Ionicons
                    name={feature.included ? 'checkmark-circle' : 'close-circle'}
                    size={20}
                    color={feature.included ? colors.success : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.featureText,
                      !feature.included && styles.featureTextDisabled,
                    ]}
                  >
                    {feature.text}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.planAction}>
              <Button
                label={plan.recommended ? 'Assinar Microlearning' : 'Assinar Básico'}
                onPress={() => handleSubscribe(plan)}
                variant={plan.recommended ? 'filled' : 'outlined'}
              />
            </View>
          </View>
        ))}

        {/* Footer */}
        <Text style={styles.footerText}>
          Cancele a qualquer momento. Sem compromisso.
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  planCardRecommended: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  recommendedText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  planName: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.lg,
  },
  planPrice: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  planPeriod: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginLeft: spacing.xs,
  },
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  featureTextDisabled: {
    color: colors.textSecondary,
  },
  planAction: {
    marginTop: spacing.sm,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
