import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card } from '../components';
import {
  getProgressOverview,
  getProgressByDisciplina,
  getWeeklyProgress,
  ProgressOverviewData,
  DisciplinaProgressData,
  WeeklyHistogramData,
} from '../services/api';

// ── SVG-free Chart Components ──────────────────────────
// Using plain Views for charts to avoid react-native-svg dependency issues

// Donut chart approximation with View + border tricks
function DonutChart({ percent }: { percent: number }) {
  const { colors } = useTheme();
  const donutStyles = createDonutStyles(colors);
  const size = 140;

  return (
    <View style={[donutStyles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          donutStyles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.surface,
          },
        ]}
      />
      {/* Foreground ring using a clipping approach */}
      <View
        style={[
          donutStyles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: colors.accent,
            borderTopColor: percent > 25 ? colors.accent : colors.surface,
            borderRightColor: percent > 50 ? colors.accent : colors.surface,
            borderBottomColor: percent > 75 ? colors.accent : colors.surface,
            borderLeftColor: percent > 0 ? colors.accent : colors.surface,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      {/* Center label */}
      <View style={donutStyles.center}>
        <Text style={donutStyles.percentText}>{percent}%</Text>
        <Text style={donutStyles.percentLabel}>cobertura</Text>
      </View>
    </View>
  );
}

const createDonutStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 12,
  },
  center: {
    alignItems: 'center',
  },
  percentText: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  percentLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});

// Horizontal progress bar for disciplinas
function DisciplinaBar({
  data,
  maxHours,
  onPress,
}: {
  data: DisciplinaProgressData;
  maxHours: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const barStyles = createBarStyles(colors);
  const progressWidth = maxHours > 0 ? (data.hours_studied / maxHours) * 100 : 0;
  const plannedWidth = maxHours > 0 ? (data.hours_planned / maxHours) * 100 : 0;

  return (
    <Pressable onPress={onPress} style={barStyles.container}>
      <View style={barStyles.header}>
        <Text style={barStyles.name} numberOfLines={1}>
          {data.disciplina_name}
        </Text>
        <Text style={barStyles.hours}>
          {data.hours_studied}h / {data.hours_planned}h
        </Text>
      </View>
      <View style={barStyles.trackOuter}>
        <View
          style={[
            barStyles.trackPlanned,
            { width: `${Math.min(plannedWidth, 100)}%` },
          ]}
        />
        <View
          style={[
            barStyles.trackStudied,
            { width: `${Math.min(progressWidth, 100)}%` },
          ]}
        />
      </View>
      <View style={barStyles.footer}>
        <Text style={barStyles.progress}>{data.progress_percent}%</Text>
        {data.weight != null && data.weight > 0 && (
          <Text style={barStyles.weight}>Peso {data.weight}</Text>
        )}
      </View>
    </Pressable>
  );
}

const createBarStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
    marginRight: spacing.sm,
  },
  hours: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  trackOuter: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackPlanned: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.accent + '30',
    borderRadius: 4,
  },
  trackStudied: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progress: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  weight: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});

// Weekly histogram using Views
function WeeklyHistogram({ data }: { data: WeeklyHistogramData[] }) {
  const { colors } = useTheme();
  const histStyles = createHistStyles(colors);
  const maxHours = Math.max(...data.map((d) => d.hours), 1);

  return (
    <View style={histStyles.container}>
      {data.map((day, i) => {
        const barHeight = (day.hours / maxHours) * 100;
        const isToday = i === data.length - 1;
        return (
          <View key={day.date} style={histStyles.column}>
            <Text style={histStyles.value}>
              {day.hours > 0 ? `${day.hours}h` : ''}
            </Text>
            <View style={histStyles.barTrack}>
              <View
                style={[
                  histStyles.bar,
                  {
                    height: `${Math.max(barHeight, 2)}%`,
                    backgroundColor: isToday ? colors.accentSecondary : colors.accent,
                  },
                ]}
              />
            </View>
            <Text
              style={[histStyles.dayLabel, isToday && histStyles.dayLabelActive]}
            >
              {day.day_name}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const createHistStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: spacing.md,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    color: colors.textSecondary,
    fontSize: 10,
    height: 14,
  },
  barTrack: {
    flex: 1,
    width: 24,
    backgroundColor: colors.surface,
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
    minHeight: 2,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  dayLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
});

// ── Stats Card ─────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color: iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const { colors } = useTheme();
  const statStyles = createStatStyles(colors);
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const createStatStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
  },
});

// ── Main Progress Screen ───────────────────────────────

export function ProgressScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const [overview, setOverview] = useState<ProgressOverviewData | null>(null);
  const [disciplinas, setDisciplinas] = useState<DisciplinaProgressData[]>([]);
  const [weekly, setWeekly] = useState<WeeklyHistogramData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ov, disc, wk] = await Promise.all([
        getProgressOverview(),
        getProgressByDisciplina(),
        getWeeklyProgress(),
      ]);
      setOverview(ov);
      setDisciplinas(disc);
      setWeekly(wk);
    } catch {
      setError('Não foi possível carregar o progresso.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !overview) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Erro ao carregar dados.'}</Text>
      </View>
    );
  }

  const maxDisciplinaHours = Math.max(
    ...disciplinas.map((d) => Math.max(d.hours_planned, d.hours_studied)),
    1,
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard
          icon="time-outline"
          label="Horas totais"
          value={`${overview.hours_studied}h`}
          color={colors.accent}
        />
        <StatCard
          icon="flame-outline"
          label="Sequência"
          value={`${overview.streak_days}d`}
          color={colors.warning}
        />
        <StatCard
          icon="checkmark-circle-outline"
          label="Cobertura"
          value={`${overview.coverage_percent}%`}
          color={colors.success}
        />
      </View>

      {/* Donut Chart Section */}
      <Card style={styles.section} header="Progresso Geral">
        <View style={styles.donutContainer}>
          <DonutChart percent={overview.coverage_percent} />
          <View style={styles.donutStats}>
            <View style={styles.donutStat}>
              <View style={[styles.dot, { backgroundColor: colors.accent }]} />
              <Text style={styles.donutStatText}>
                {overview.hours_studied}h estudadas
              </Text>
            </View>
            <View style={styles.donutStat}>
              <View
                style={[styles.dot, { backgroundColor: colors.accent + '30' }]}
              />
              <Text style={styles.donutStatText}>
                {overview.hours_planned}h planejadas
              </Text>
            </View>
            <View style={styles.donutStat}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={styles.donutStatText}>
                {overview.completed_blocks}/{overview.total_blocks} blocos
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Weekly Histogram */}
      <Card style={styles.section} header="Esta semana">
        <WeeklyHistogram data={weekly} />
      </Card>

      {/* Per-Disciplina Breakdown */}
      <Card style={styles.section} header="Por disciplina">
        {disciplinas.map((d) => (
          <DisciplinaBar
            key={d.disciplina_id}
            data={d}
            maxHours={maxDisciplinaHours}
            onPress={() =>
              navigation.navigate('DisciplinaDetail', {
                disciplinaId: d.disciplina_id,
                disciplinaName: d.disciplina_name,
              })
            }
          />
        ))}
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  donutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
  },
  donutStats: {
    gap: spacing.md,
  },
  donutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  donutStatText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
