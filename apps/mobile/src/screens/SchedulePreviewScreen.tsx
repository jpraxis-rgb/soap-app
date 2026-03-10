import React, { useMemo, useState } from 'react';
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
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button } from '../components';
import { useConcurso } from '../contexts/ConcursoContext';

// ── Types ──────────────────────────────────────────────

interface ParsedEditalData {
  id: string;
  banca: string;
  orgao: string;
  cargo: string;
  exam_date: string;
  confidence: number;
  disciplinas: { id: string; name: string; weight: number; topics: string[] }[];
}

interface ScheduleConfig {
  hours_per_week: number;
  available_days: number[]; // 0=Mon..6=Sun
  preferred_time: 'morning' | 'afternoon' | 'evening';
}

interface SchedulePreviewScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void; reset: (state: any) => void };
  route: { params: { edital: ParsedEditalData; config: ScheduleConfig } };
}

// ── Constants ──────────────────────────────────────────

const SUBJECT_COLORS = ['#7C5CFC', '#FF6B9D', '#00D4AA', '#FFB347', '#FF4757', '#4ECDC4'];
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ── Schedule Generation Helpers ────────────────────────

function computeWeeksUntilExam(examDate: string): number {
  try {
    const exam = new Date(examDate);
    const now = new Date();
    const diffMs = exam.getTime() - now.getTime();
    const weeks = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
    return weeks;
  } catch {
    return 12; // fallback
  }
}

interface SubjectAllocation {
  id: string;
  name: string;
  weight: number;
  hours: number;
  color: string;
}

function computeAllocations(
  disciplinas: ParsedEditalData['disciplinas'],
  hoursPerWeek: number,
): SubjectAllocation[] {
  const totalWeight = disciplinas.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight === 0) return [];

  return disciplinas.map((d, i) => ({
    id: d.id,
    name: d.name,
    weight: d.weight,
    hours: Math.round((d.weight / totalWeight) * hoursPerWeek * 10) / 10,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));
}

interface WeeklyBlock {
  subjectIndex: number;
  color: string;
  name: string;
}

function generateWeeklyGrid(
  allocations: SubjectAllocation[],
  availableDays: number[],
): WeeklyBlock[][] {
  // For each day of the week (0-6), generate 2-3 blocks for available days
  const grid: WeeklyBlock[][] = [];

  for (let day = 0; day < 7; day++) {
    if (!availableDays.includes(day)) {
      grid.push([]);
      continue;
    }

    // Distribute subjects across available days
    const blocksPerDay = allocations.length >= 3 ? 3 : Math.max(2, allocations.length);
    const dayBlocks: WeeklyBlock[] = [];

    for (let b = 0; b < blocksPerDay; b++) {
      const subjectIndex = (day * blocksPerDay + b) % allocations.length;
      const alloc = allocations[subjectIndex];
      dayBlocks.push({
        subjectIndex,
        color: alloc.color,
        name: alloc.name,
      });
    }

    grid.push(dayBlocks);
  }

  return grid;
}

// ── Main Screen ────────────────────────────────────────

export function SchedulePreviewScreen({ navigation, route }: SchedulePreviewScreenProps) {
  const { confirmEdital, setScheduleConfig } = useConcurso();
  const { edital, config } = route.params;
  const [saving, setSaving] = useState(false);

  const weeksUntilExam = useMemo(() => computeWeeksUntilExam(edital.exam_date), [edital.exam_date]);
  const allocations = useMemo(
    () => computeAllocations(edital.disciplinas, config.hours_per_week),
    [edital.disciplinas, config.hours_per_week],
  );
  const maxHours = useMemo(() => Math.max(...allocations.map((a) => a.hours), 1), [allocations]);
  const weeklyGrid = useMemo(
    () => generateWeeklyGrid(allocations, config.available_days),
    [allocations, config.available_days],
  );

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await confirmEdital(edital, config);

      Alert.alert(
        'Cronograma salvo!',
        `Seu plano de estudos para ${edital.orgao} - ${edital.cargo} foi criado com sucesso.`,
        [
          {
            text: 'Ir para inicio',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            },
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Nao foi possivel salvar o cronograma.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Prévia do cronograma</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {edital.orgao} - {edital.cargo}
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryWrapper}>
          <LinearGradient
            colors={[colors.accent, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeksUntilExam}</Text>
              <Text style={styles.summaryLabel}>semanas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{config.hours_per_week}h</Text>
              <Text style={styles.summaryLabel}>por semana</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{edital.disciplinas.length}</Text>
              <Text style={styles.summaryLabel}>disciplinas</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Per-disciplina allocation */}
        <Card style={styles.card} header="Distribuição por disciplina">
          <View style={styles.allocationList}>
            {allocations.map((alloc) => (
              <View key={alloc.id} style={styles.allocationRow}>
                <View style={styles.allocationInfo}>
                  <View style={[styles.colorDot, { backgroundColor: alloc.color }]} />
                  <Text style={styles.allocationName} numberOfLines={1}>
                    {alloc.name}
                  </Text>
                </View>
                <View style={styles.allocationBarContainer}>
                  <View style={styles.allocationBarBackground}>
                    <View
                      style={[
                        styles.allocationBar,
                        {
                          backgroundColor: alloc.color,
                          width: `${(alloc.hours / maxHours) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.allocationHours}>{alloc.hours}h</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Weekly Grid */}
        <Card style={styles.card} header="Visão semanal">
          <View style={styles.weekGrid}>
            {DAY_LABELS.map((label, dayIndex) => {
              const blocks = weeklyGrid[dayIndex];
              const isAvailable = config.available_days.includes(dayIndex);

              return (
                <View key={label} style={styles.dayColumn}>
                  <Text
                    style={[
                      styles.dayLabel,
                      isAvailable && styles.dayLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                  <View style={styles.dayBlocks}>
                    {blocks.length > 0 ? (
                      blocks.map((block, i) => (
                        <View
                          key={i}
                          style={[
                            styles.block,
                            { backgroundColor: block.color + '40' },
                          ]}
                        >
                          <View
                            style={[
                              styles.blockAccent,
                              { backgroundColor: block.color },
                            ]}
                          />
                        </View>
                      ))
                    ) : (
                      <View style={styles.restBlock}>
                        <Ionicons name="moon-outline" size={12} color={colors.textSecondary} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {allocations.slice(0, 6).map((alloc) => (
              <View key={alloc.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: alloc.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {alloc.name}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            label="Confirmar cronograma"
            onPress={handleConfirm}
            size="lg"
            icon={<Ionicons name="checkmark-circle" size={20} color={colors.text} />}
          />
          <Button
            label="Ajustar configuração"
            onPress={() => navigation.goBack()}
            variant="outlined"
            size="lg"
            icon={<Ionicons name="settings-outline" size={20} color={colors.accent} />}
            style={styles.adjustButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  summaryWrapper: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.xxl + 6,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  allocationList: {
    gap: spacing.sm,
  },
  allocationRow: {
    gap: spacing.xs,
  },
  allocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  allocationName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  allocationBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.lg - 2, // align with name text
  },
  allocationBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  allocationBar: {
    height: 8,
    borderRadius: 4,
  },
  allocationHours: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    minWidth: 30,
    textAlign: 'right',
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  dayLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  dayBlocks: {
    gap: spacing.xs,
    width: '100%',
    alignItems: 'center',
  },
  block: {
    width: '100%',
    height: 28,
    borderRadius: borderRadius.sm - 2,
    overflow: 'hidden',
  },
  blockAccent: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
  },
  restBlock: {
    width: '100%',
    height: 28,
    borderRadius: borderRadius.sm - 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    maxWidth: 100,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  adjustButton: {
    marginTop: 0,
  },
});
