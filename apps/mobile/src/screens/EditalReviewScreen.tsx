import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Card, Badge } from '../components';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Disciplina {
  id: string;
  name: string;
  weight: number;
  topics: string[];
  category?: 'geral' | 'especifico';
}

interface ParsedEditalData {
  id: string;
  banca: string;
  orgao: string;
  cargo: string;
  exam_date: string;
  confidence: number;
  disciplinas: Disciplina[];
}

interface EditalReviewScreenProps {
  navigation: { navigate: (screen: string, params?: any) => void; goBack: () => void };
  route: { params: { edital: ParsedEditalData } };
}

function DisciplinaCard({ disciplina }: { disciplina: Disciplina }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Pressable onPress={toggleExpand}>
      <Card style={styles.disciplinaCard}>
        <View style={styles.disciplinaHeader}>
          <View style={styles.disciplinaInfo}>
            <Text style={styles.disciplinaName}>{disciplina.name}</Text>
            <Text style={styles.topicCount}>
              {disciplina.topics.length} {disciplina.topics.length === 1 ? 'topico' : 'topicos'}
            </Text>
          </View>
          <View style={styles.disciplinaRight}>
            <Badge text={`Peso ${disciplina.weight}`} color={colors.accent + '40'} />
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </View>
        </View>

        {expanded && (
          <View style={styles.topicsList}>
            {disciplina.topics.map((topic, index) => (
              <View key={index} style={styles.topicRow}>
                <View style={styles.topicBullet} />
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Data não definida';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function EditalReviewScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params as { edital?: ParsedEditalData } | undefined;
  const edital = params?.edital;

  if (!edital) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Text style={{ color: colors.text, fontSize: typography.sizes.md }}>
            Nenhum edital para revisar.
          </Text>
        </View>
      </View>
    );
  }

  const confidencePercent = Math.round((edital.confidence ?? 0) * 100);

  // Group disciplines by category
  const gerais = edital.disciplinas.filter(d => d.category === 'geral');
  const especificos = edital.disciplinas.filter(d => d.category === 'especifico');
  const uncategorized = edital.disciplinas.filter(d => !d.category);
  const hasCategories = gerais.length > 0 || especificos.length > 0;

  const handleConfirm = () => {
    navigation.navigate('ScheduleConfig', { edital });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Edital Summary Card */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="business-outline" size={20} color={colors.accent} />
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Orgao</Text>
              <Text style={styles.summaryValue}>{edital.orgao}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Ionicons name="briefcase-outline" size={20} color={colors.accent} />
            <View style={styles.summaryTextBlock}>
              <Text style={styles.summaryLabel}>Cargo</Text>
              <Text style={styles.summaryValue}>{edital.cargo}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{edital.banca}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(edital.exam_date)}</Text>
            </View>
          </View>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confianca da analise</Text>
            <Badge
              text={`${confidencePercent}%`}
              color={confidencePercent >= 80 ? colors.success + '30' : colors.warning + '30'}
            />
          </View>
        </Card>

        {/* Disciplinas */}
        {hasCategories ? (
          <>
            {/* Conhecimentos Gerais */}
            {gerais.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Conhecimentos Gerais</Text>
                  <Text style={styles.sectionCount}>{gerais.length}</Text>
                </View>
                {gerais.map((disciplina) => (
                  <DisciplinaCard key={disciplina.id} disciplina={disciplina} />
                ))}
              </>
            )}

            {/* Conhecimentos Específicos */}
            {especificos.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Conhecimentos Espec\u00edficos</Text>
                  <Text style={styles.sectionCount}>{especificos.length}</Text>
                </View>
                {especificos.map((disciplina) => (
                  <DisciplinaCard key={disciplina.id} disciplina={disciplina} />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* Uncategorized — backwards compatible */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Disciplinas</Text>
              <Text style={styles.sectionCount}>{uncategorized.length} encontradas</Text>
            </View>
            {uncategorized.map((disciplina) => (
              <DisciplinaCard key={disciplina.id} disciplina={disciplina} />
            ))}
          </>
        )}

        <View style={{ height: spacing.xxl + spacing.xxl }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomBar}>
        <Pressable onPress={handleConfirm} style={styles.confirmButtonWrapper}>
          <LinearGradient
            colors={[colors.accent, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButton}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
            <Text style={styles.confirmButtonText}>Confirmar e gerar cronograma</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  summaryCard: {
    marginHorizontal: spacing.md,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  summaryTextBlock: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.surface,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  sectionCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  disciplinaCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  disciplinaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disciplinaInfo: {
    flex: 1,
    gap: 2,
  },
  disciplinaName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  topicCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  disciplinaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicsList: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    gap: spacing.sm,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  topicBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  topicText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  confirmButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
