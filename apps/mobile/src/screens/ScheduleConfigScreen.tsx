import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button } from '../components';

// ── Types ──────────────────────────────────────────────

interface ParsedEditalData {
  id: string;
  banca: string;
  orgao: string;
  cargo: string;
  exam_date: string;
  confidence: number;
  disciplinas: { id: string; name: string; weight: number | null; topics: string[] }[];
}

export interface ScheduleConfig {
  hours_per_week: number;
  available_days: number[]; // 0=Mon..6=Sun
  preferred_time: 'morning' | 'afternoon' | 'evening';
  day_configs: Record<number, number>; // 0=Mon..6=Sun → hours
  disciplines_per_day: number;
}

interface ScheduleConfigScreenProps {
  navigation: { navigate: (screen: string, params?: any) => void; goBack: () => void };
  route: { params: { edital: ParsedEditalData } };
}

// ── Day Config ──────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// Default: Mon-Fri 2h each, Sat-Sun 0h
const DEFAULT_DAY_CONFIGS: Record<number, number> = {
  0: 2, 1: 2, 2: 2, 3: 2, 4: 2, 5: 0, 6: 0,
};

// ── Time Segment Options ───────────────────────────────

const TIME_OPTIONS: { key: 'morning' | 'afternoon' | 'evening'; label: string }[] = [
  { key: 'morning', label: 'Manhã' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'evening', label: 'Noite' },
];

// ── Mini Stepper Component ──────────────────────────────

function MiniStepper({
  value,
  min,
  max,
  step,
  suffix,
  onDecrement,
  onIncrement,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={miniStepperStyles.container}>
      <Pressable
        onPress={onDecrement}
        style={[miniStepperStyles.button, value <= min && miniStepperStyles.buttonDisabled]}
        disabled={value <= min}
      >
        <Ionicons
          name="remove"
          size={16}
          color={value <= min ? colors.textSecondary : colors.text}
        />
      </Pressable>
      <Text style={miniStepperStyles.value}>
        {value % 1 === 0 ? value : value.toFixed(1)}{suffix || ''}
      </Text>
      <Pressable
        onPress={onIncrement}
        style={[miniStepperStyles.button, value >= max && miniStepperStyles.buttonDisabled]}
        disabled={value >= max}
      >
        <Ionicons
          name="add"
          size={16}
          color={value >= max ? colors.textSecondary : colors.text}
        />
      </Pressable>
    </View>
  );
}

const miniStepperStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    minWidth: 40,
    textAlign: 'center',
  },
});

// ── Main Screen ────────────────────────────────────────

export function ScheduleConfigScreen({ navigation, route }: ScheduleConfigScreenProps) {
  const { edital } = route.params;

  const [dayConfigs, setDayConfigs] = useState<Record<number, number>>(DEFAULT_DAY_CONFIGS);
  const [disciplinesPerDay, setDisciplinesPerDay] = useState(3);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);

  const examDateValid = (() => {
    if (!edital.exam_date || !edital.exam_date.trim()) return false;
    try {
      const d = new Date(edital.exam_date);
      return !isNaN(d.getTime()) && d > new Date();
    } catch { return false; }
  })();
  const hasExamDate = examDateValid;
  const [dateInput, setDateInput] = useState(() => {
    if (hasExamDate) {
      const [y, m, d] = edital.exam_date.split('-');
      return d && m && y ? `${d}/${m}/${y}` : '';
    }
    return '';
  });

  const concursoName = `${edital.orgao} - ${edital.cargo}`;

  const totalHoursPerWeek = useMemo(() =>
    Object.values(dayConfigs).reduce((sum, h) => sum + h, 0),
    [dayConfigs],
  );

  const availableDays = useMemo(() =>
    Object.entries(dayConfigs)
      .filter(([, hours]) => hours > 0)
      .map(([day]) => Number(day)),
    [dayConfigs],
  );

  const toggleDay = (dayIndex: number) => {
    setDayConfigs((prev) => ({
      ...prev,
      [dayIndex]: prev[dayIndex] > 0 ? 0 : 2, // Toggle between 0 and 2h default
    }));
  };

  const updateDayHours = (dayIndex: number, delta: number) => {
    setDayConfigs((prev) => ({
      ...prev,
      [dayIndex]: Math.max(0.5, Math.min(8, (prev[dayIndex] || 0) + delta)),
    }));
  };

  /** Parse DD/MM/YYYY → YYYY-MM-DD or return null */
  const parseUserDate = (input: string): string | null => {
    const match = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    const [, dd, mm, yyyy] = match;
    const d = new Date(`${yyyy}-${mm}-${dd}`);
    if (isNaN(d.getTime())) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

  const formattedExamDate = (() => {
    if (!hasExamDate) return '';
    try {
      const date = new Date(edital.exam_date);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return edital.exam_date;
    }
  })();

  const handleGenerate = () => {
    if (availableDays.length === 0) return;

    let finalEdital = edital;
    if (!hasExamDate) {
      const parsed = parseUserDate(dateInput);
      if (!parsed) {
        finalEdital = { ...edital, exam_date: '' };
      } else {
        finalEdital = { ...edital, exam_date: parsed };
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const config: ScheduleConfig = {
        hours_per_week: totalHoursPerWeek,
        available_days: availableDays,
        preferred_time: preferredTime,
        day_configs: dayConfigs,
        disciplines_per_day: disciplinesPerDay,
      };
      navigation.navigate('SchedulePreview', { edital: finalEdital, config });
    }, 1000);
  };

  // ── Loading State ──────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingTitle}>Calculando seu plano de estudos...</Text>
        <Text style={styles.loadingSubtitle}>
          Analisando {edital.disciplinas.length} disciplinas
        </Text>
      </View>
    );
  }

  // ── Main Layout ────────────────────────────────────

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
            <Text style={styles.title}>Configurar cronograma</Text>
            <Text style={styles.concursoName} numberOfLines={1}>
              {concursoName}
            </Text>
          </View>
        </View>

        {/* Per-day hours config */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Horas por dia</Text>
          </View>
          <View style={styles.dayConfigList}>
            {DAY_LABELS.map((label, index) => {
              const hours = dayConfigs[index] || 0;
              const enabled = hours > 0;

              return (
                <View key={label} style={styles.dayConfigRow}>
                  <View style={styles.dayConfigLeft}>
                    <Switch
                      value={enabled}
                      onValueChange={() => toggleDay(index)}
                      trackColor={{ false: colors.surface, true: colors.accent + '60' }}
                      thumbColor={enabled ? colors.accent : colors.textSecondary}
                    />
                    <Text style={[styles.dayConfigLabel, !enabled && styles.dayConfigLabelDisabled]}>
                      {label}
                    </Text>
                  </View>
                  {enabled && (
                    <MiniStepper
                      value={hours}
                      min={0.5}
                      max={8}
                      step={0.5}
                      suffix="h"
                      onDecrement={() => updateDayHours(index, -0.5)}
                      onIncrement={() => updateDayHours(index, 0.5)}
                    />
                  )}
                </View>
              );
            })}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalHoursPerWeek}h/semana</Text>
          </View>
        </Card>

        {/* Disciplines per day */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="layers-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Disciplinas por dia</Text>
          </View>
          <View style={styles.disciplinesPerDayRow}>
            <Text style={styles.disciplinesPerDayHint}>
              Quantas disciplinas diferentes estudar por dia?
            </Text>
            <MiniStepper
              value={disciplinesPerDay}
              min={1}
              max={5}
              step={1}
              onDecrement={() => setDisciplinesPerDay((v) => Math.max(1, v - 1))}
              onIncrement={() => setDisciplinesPerDay((v) => Math.min(5, v + 1))}
            />
          </View>
        </Card>

        {/* Preferred study time */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="sunny-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Horário preferido</Text>
          </View>
          <View style={styles.segmentedControl}>
            {TIME_OPTIONS.map((option) => {
              const isSelected = preferredTime === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => setPreferredTime(option.key)}
                  style={[
                    styles.segmentOption,
                    isSelected && styles.segmentOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      isSelected && styles.segmentTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Exam date */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="flag-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Data da prova</Text>
          </View>
          {hasExamDate ? (
            <Text style={styles.examDate}>{formattedExamDate}</Text>
          ) : (
            <View>
              <TextInput
                style={styles.dateInput}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textSecondary}
                value={dateInput}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '').slice(0, 8);
                  let formatted = digits;
                  if (digits.length > 4) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
                  } else if (digits.length > 2) {
                    formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                  }
                  setDateInput(formatted);
                }}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={styles.dateHint}>
                {dateInput.length === 0
                  ? 'Opcional — sem data, usaremos 12 semanas a partir de hoje'
                  : parseUserDate(dateInput)
                    ? ''
                    : 'Formato: DD/MM/AAAA'}
              </Text>
            </View>
          )}
        </Card>

        {/* Disciplinas summary */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="book-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>
              {edital.disciplinas.length} disciplinas do edital
            </Text>
          </View>
          <View style={styles.disciplinaList}>
            {edital.disciplinas.slice(0, 5).map((d) => (
              <View key={d.id} style={styles.disciplinaRow}>
                <Text style={styles.disciplinaName} numberOfLines={1}>
                  {d.name}
                </Text>
                <Text style={styles.disciplinaWeight}>
                  {d.weight != null ? `Peso ${d.weight}` : 'Sem peso'}
                </Text>
              </View>
            ))}
            {edital.disciplinas.length > 5 && (
              <Text style={styles.moreText}>
                +{edital.disciplinas.length - 5} mais
              </Text>
            )}
          </View>
        </Card>

        {/* Generate button */}
        <View style={styles.buttonContainer}>
          <Button
            label="Gerar cronograma"
            onPress={handleGenerate}
            size="lg"
            disabled={availableDays.length === 0}
            icon={<Ionicons name="sparkles" size={20} color={colors.text} />}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  loadingTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
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
  concursoName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  dayConfigList: {
    gap: spacing.sm,
  },
  dayConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 40,
  },
  dayConfigLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayConfigLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  dayConfigLabelDisabled: {
    color: colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  totalValue: {
    color: colors.accent,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  disciplinesPerDayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disciplinesPerDayHint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentOptionSelected: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  segmentTextSelected: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  examDate: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  dateInput: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dateHint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  disciplinaList: {
    gap: spacing.sm,
  },
  disciplinaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disciplinaName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  disciplinaWeight: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  moreText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
});
