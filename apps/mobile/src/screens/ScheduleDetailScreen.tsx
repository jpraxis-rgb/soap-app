import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card, Badge } from '../components';

// ── Mock Data ──────────────────────────────────────────

interface ScheduleBlock {
  id: string;
  time: string;
  disciplina: string;
  topic: string;
  durationMinutes: number;
  status: 'pending' | 'completed' | 'skipped';
}

interface DaySection {
  title: string;
  data: ScheduleBlock[];
}

const MOCK_EXAM = {
  name: 'Concurso TRF 3\u00AA Regi\u00E3o',
  daysUntil: 90,
  totalHoursPlanned: 320,
};

const MOCK_SECTIONS: DaySection[] = [
  {
    title: 'Hoje',
    data: [
      { id: '1', time: '08:00', disciplina: 'Direito Constitucional', topic: 'Princ\u00EDpios Fundamentais', durationMinutes: 60, status: 'completed' },
      { id: '2', time: '10:00', disciplina: 'Direito Administrativo', topic: 'Atos Administrativos', durationMinutes: 45, status: 'pending' },
      { id: '3', time: '14:00', disciplina: 'Portugu\u00EAs', topic: 'Concord\u00E2ncia Verbal', durationMinutes: 30, status: 'pending' },
    ],
  },
  {
    title: 'Amanh\u00E3',
    data: [
      { id: '4', time: '08:00', disciplina: 'Racioc\u00EDnio L\u00F3gico', topic: 'Proposi\u00E7\u00F5es e Conectivos', durationMinutes: 45, status: 'pending' },
      { id: '5', time: '10:00', disciplina: 'Inform\u00E1tica', topic: 'Seguran\u00E7a da Informa\u00E7\u00E3o', durationMinutes: 30, status: 'pending' },
      { id: '6', time: '14:00', disciplina: 'Legisla\u00E7\u00E3o Espec\u00EDfica', topic: 'Organiza\u00E7\u00E3o Judici\u00E1ria', durationMinutes: 60, status: 'pending' },
    ],
  },
  {
    title: 'Quarta-feira',
    data: [
      { id: '7', time: '08:00', disciplina: 'Direito Constitucional', topic: 'Organiza\u00E7\u00E3o do Estado', durationMinutes: 60, status: 'pending' },
      { id: '8', time: '10:00', disciplina: 'Direito Administrativo', topic: 'Licita\u00E7\u00F5es', durationMinutes: 45, status: 'pending' },
    ],
  },
];

// ── Block Item ─────────────────────────────────────────

function BlockItem({ block }: { block: ScheduleBlock }) {
  const { colors } = useTheme();
  const blockStyles = createBlockStyles(colors);

  function statusConfig(status: ScheduleBlock['status']) {
    switch (status) {
      case 'completed':
        return { label: 'Conclu\u00EDdo', color: colors.success };
      case 'skipped':
        return { label: 'Pulado', color: colors.warning };
      default:
        return { label: 'Pendente', color: colors.textSecondary };
    }
  }

  const { label, color } = statusConfig(block.status);
  const isCompleted = block.status === 'completed';

  return (
    <Card style={blockStyles.card}>
      <View style={blockStyles.row}>
        <View style={blockStyles.timeColumn}>
          <Ionicons
            name="time-outline"
            size={14}
            color={isCompleted ? colors.success : colors.textSecondary}
          />
          <Text style={[blockStyles.time, isCompleted && { color: colors.success }]}>
            {block.time}
          </Text>
        </View>

        <View style={blockStyles.content}>
          <Text
            style={[
              blockStyles.disciplina,
              isCompleted && blockStyles.disciplinaCompleted,
            ]}
            numberOfLines={1}
          >
            {block.disciplina}
          </Text>
          <Text style={blockStyles.topic} numberOfLines={1}>
            {block.topic}
          </Text>
        </View>

        <View style={blockStyles.meta}>
          <Text style={blockStyles.duration}>{block.durationMinutes}min</Text>
          <Badge text={label} color={color + '40'} />
        </View>
      </View>
    </Card>
  );
}

const createBlockStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: 70,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  disciplina: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  disciplinaCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  topic: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});

// ── Main Screen ────────────────────────────────────────

export function ScheduleDetailScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const totalBlocks = MOCK_SECTIONS.reduce((sum, s) => sum + s.data.length, 0);
  const completedBlocks = MOCK_SECTIONS.reduce(
    (sum, s) => sum + s.data.filter((b) => b.status === 'completed').length,
    0,
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={MOCK_SECTIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Overview Card */}
            <View style={styles.overviewWrapper}>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overviewCard}
              >
                <Text style={styles.examName}>{MOCK_EXAM.name}</Text>
                <View style={styles.overviewStats}>
                  <View style={styles.overviewStat}>
                    <Text style={styles.overviewValue}>{MOCK_EXAM.daysUntil}</Text>
                    <Text style={styles.overviewLabel}>dias restantes</Text>
                  </View>
                  <View style={styles.overviewDivider} />
                  <View style={styles.overviewStat}>
                    <Text style={styles.overviewValue}>{MOCK_EXAM.totalHoursPlanned}h</Text>
                    <Text style={styles.overviewLabel}>planejadas</Text>
                  </View>
                  <View style={styles.overviewDivider} />
                  <View style={styles.overviewStat}>
                    <Text style={styles.overviewValue}>
                      {completedBlocks}/{totalBlocks}
                    </Text>
                    <Text style={styles.overviewLabel}>blocos</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        renderItem={({ item }) => <BlockItem block={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum tópico encontrado</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: spacing.xxl }} />}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overviewWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  overviewCard: {
    borderRadius: 16,
    padding: spacing.lg,
  },
  examName: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewValue: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  overviewLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
