import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { Card, Button } from '../components';
import { useAuth } from '../contexts/AuthContext';

interface PlanInfo {
  tier: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  gradientColors: [string, string];
  recommended?: boolean;
}

const plans: PlanInfo[] = [
  {
    tier: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    description: 'Comece a organizar seus estudos',
    features: [
      'Upload de 1 edital',
      'Cronograma básico',
      'Acompanhamento de progresso',
    ],
    gradientColors: [colors.textSecondary, '#666688'],
  },
  {
    tier: 'registro',
    name: 'Básico',
    price: 'R$ 19,90/mês',
    description: 'Para quem quer mais organização',
    features: [
      'Upload ilimitado de editais',
      'Cronograma personalizado',
      'Relatórios detalhados',
      'Suporte prioritário',
    ],
    gradientColors: [colors.success, '#009977'],
  },
  {
    tier: 'microlearning',
    name: 'Microlearning',
    price: 'R$ 39,90/mês',
    description: 'Conteúdo inteligente adaptado a você',
    features: [
      'Tudo do Básico',
      'Flashcards com IA',
      'Resumos personalizados',
      'Quizzes adaptativos',
      'Conteúdo offline',
    ],
    gradientColors: [colors.accent, '#4A3ACD'],
    recommended: true,
  },
  {
    tier: 'mentor',
    name: 'Mentor',
    price: 'R$ 79,90/mês',
    description: 'Acompanhamento completo',
    features: [
      'Tudo do Microlearning',
      'Mentoria com IA',
      'Plano de estudos avançado',
      'Simulados exclusivos',
      'Acesso antecipado a novidades',
    ],
    gradientColors: [colors.accentPink, '#CC4477'],
  },
];

export function SubscriptionScreen() {
  const { subscriptionTier, refreshUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (tier: string) => {
    if (tier === subscriptionTier) return;

    if (tier === 'free') {
      Alert.alert(
        'Downgrade',
        'Deseja cancelar sua assinatura? Você manterá acesso até o fim do período.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: async () => {
              setLoading(tier);
              try {
                // In a real app, call subscriptionsApi.cancel()
                Alert.alert('Sucesso', 'Assinatura cancelada.');
                await refreshUser();
              } catch {
                Alert.alert('Erro', 'Não foi possível cancelar.');
              } finally {
                setLoading(null);
              }
            },
          },
        ],
      );
      return;
    }

    setLoading(tier);
    try {
      // In a real app, initiate payment flow then call subscriptionsApi.create(tier)
      Alert.alert(
        'Pagamento',
        'Integração com pagamento em breve. O plano será ativado após confirmação.',
      );
      await refreshUser();
    } catch {
      Alert.alert('Erro', 'Não foi possível processar.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Escolha seu plano</Text>
      <Text style={styles.subtitle}>
        Encontre o plano ideal para sua preparação
      </Text>

      {plans.map((plan) => {
        const isCurrent = plan.tier === subscriptionTier;

        return (
          <Card
            key={plan.tier}
            style={[
              styles.planCard,
              isCurrent && styles.currentPlanCard,
            ]}
          >
            {plan.recommended && (
              <LinearGradient
                colors={plan.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recommendedBadge}
              >
                <Text style={styles.recommendedText}>Recomendado</Text>
              </LinearGradient>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Atual</Text>
                </View>
              )}
            </View>

            <Text style={styles.planDescription}>{plan.description}</Text>

            <View style={styles.features}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={isCurrent ? colors.success : plan.gradientColors[0]}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {!isCurrent && (
              <Pressable
                onPress={() => handleSelectPlan(plan.tier)}
                disabled={loading !== null}
              >
                <LinearGradient
                  colors={plan.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectButton}
                >
                  <Text style={styles.selectButtonText}>
                    {loading === plan.tier
                      ? 'Processando...'
                      : plan.tier === 'free'
                        ? 'Voltar ao gratuito'
                        : 'Assinar'}
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  planCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  recommendedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: 12,
  },
  recommendedText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  planName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  planPrice: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    marginTop: spacing.xs,
  },
  currentBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  currentBadgeText: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  planDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  features: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  selectButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
