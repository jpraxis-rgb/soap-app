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
  weight: number | null;
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

function DisciplinaCard({
  disciplina,
  excluded,
  onToggleExclude,
}: {
  disciplina: Disciplina;
  excluded: boolean;
  onToggleExclude: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <Pressable onPress={toggleExpand}>
      <Card style={excluded ? [styles.disciplinaCard, styles.disciplinaCardExcluded] as any : styles.disciplinaCard}>
        <View style={styles.disciplinaHeader}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleExclude();
            }}
            hitSlop={8}
            style={styles.checkboxContainer}
          >
            <View style={[styles.checkbox, !excluded && styles.checkboxChecked]}>
              {!excluded && (
                <Ionicons name="checkmark" size={14} color={colors.text} />
              )}
            </View>
          </Pressable>
          <View style={styles.disciplinaInfo}>
            <Text
              style={[
                styles.disciplinaName,
                excluded && styles.disciplinaNameExcluded,
              ]}
            >
              {disciplina.name}
            </Text>
            <Text style={styles.topicCount}>
              {disciplina.topics.length} {disciplina.topics.length === 1 ? 'topico' : 'topicos'}
            </Text>
          </View>
          <View style={styles.disciplinaRight}>
            {disciplina.weight != null ? (
              <Badge text={`Peso ${disciplina.weight}`} color={colors.accent + '40'} />
            ) : (
              <Badge text="Sem peso" color={colors.surface} />
            )}
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

  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

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

  const toggleExclude = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const activeCount = edital.disciplinas.length - excludedIds.size;
  const confidencePercent = Math.round((edital.confidence ?? 0) * 100);

  // Group disciplines by category
  const gerais = edital.disciplinas.filter(d => d.category === 'geral');
  const especificos = edital.disciplinas.filter(d => d.category === 'especifico');
  const uncategorized = edital.disciplinas.filter(d => !d.category);
  const hasCategories = gerais.length > 0 || especificos.length > 0;

  const handleConfirm = () => {
    const activeDisciplinas = edital.disciplinas.filter(d => !excludedIds.has(d.id));
    navigation.navigate('ScheduleConfig', {
      edital: { ...edital, disciplinas: activeDisciplinas },
    });
  };

  const renderDisciplina = (disciplina: Disciplina) => (
    <DisciplinaCard
      key={disciplina.id}
      disciplina={disciplina}
      excluded={excludedIds.has(disciplina.id)}
      onToggleExclude={() => toggleExclude(disciplina.id)}
    />
  );

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
            {gerais.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Conhecimentos Gerais</Text>
                  <Text style={styles.sectionCount}>{gerais.length}</Text>
                </View>
                {gerais.map(renderDisciplina)}
              </>
            )}

            {especificos.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Conhecimentos Espec\u00edficos</Text>
                  <Text style={styles.sectionCount}>{especificos.length}</Text>
                </View>
                {especificos.map(renderDisciplina)}
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Disciplinas</Text>
              <Text style={styles.sectionCount}>{uncategorized.length} encontradas</Text>
            </View>
            {uncategorized.map(renderDisciplina)}
          </>
        )}

        <View style={{ height: spacing.xxl + spacing.xxl }} />
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.selectionCounter}>
          {activeCount} de {edital.disciplinas.length} disciplinas selecionadas
        </Text>
        <Pressable
          onPress={handleConfirm}
          style={styles.confirmButtonWrapper}
          disabled={activeCount === 0}
        >
          <LinearGradient
            colors={activeCount > 0 ? [colors.accent, colors.accentPink] : [colors.surface, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButton}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={activeCount > 0 ? colors.text : colors.textSecondary} />
            <Text style={[styles.confirmButtonText, activeCount === 0 && { color: colors.textSecondary }]}>
              Confirmar e gerar cronograma
            </Text>
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
  disciplinaCardExcluded: {
    opacity: 0.4,
  },
  disciplinaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
  disciplinaNameExcluded: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  selectionCounter: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
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
