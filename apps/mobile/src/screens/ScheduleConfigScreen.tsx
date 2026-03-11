import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
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
  disciplinas: { id: string; name: string; weight: number; topics: string[] }[];
}

export interface ScheduleConfig {
  hours_per_week: number;
  available_days: number[]; // 0=Mon..6=Sun
  preferred_time: 'morning' | 'afternoon' | 'evening';
}

interface ScheduleConfigScreenProps {
  navigation: { navigate: (screen: string, params?: any) => void; goBack: () => void };
  route: { params: { edital: ParsedEditalData } };
}

// ── Day Pills ──────────────────────────────────────────

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DEFAULT_DAYS = [0, 1, 2, 3, 4]; // Mon-Fri

// ── Time Segment Options ───────────────────────────────

const TIME_OPTIONS: { key: 'morning' | 'afternoon' | 'evening'; label: string }[] = [
  { key: 'morning', label: 'Manhã' },
  { key: 'afternoon', label: 'Tarde' },
  { key: 'evening', label: 'Noite' },
];

// ── Stepper Component ──────────────────────────────────

function Stepper({
  value,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  value: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={stepperStyles.container}>
      <Pressable
        onPress={onDecrement}
        style={[stepperStyles.button, value <= min && stepperStyles.buttonDisabled]}
        disabled={value <= min}
      >
        <Ionicons
          name="remove"
          size={20}
          color={value <= min ? colors.textSecondary : colors.text}
        />
      </Pressable>
      <View style={stepperStyles.valueContainer}>
        <Text style={stepperStyles.value}>{value}</Text>
        <Text style={stepperStyles.unit}>h/semana</Text>
      </View>
      <Pressable
        onPress={onIncrement}
        style={[stepperStyles.button, value >= max && stepperStyles.buttonDisabled]}
        disabled={value >= max}
      >
        <Ionicons
          name="add"
          size={20}
          color={value >= max ? colors.textSecondary : colors.text}
        />
      </Pressable>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 80,
  },
  value: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.xxxl + 6,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});

// ── Main Screen ────────────────────────────────────────

export function ScheduleConfigScreen({ navigation, route }: ScheduleConfigScreenProps) {
  const { edital } = route.params;

  const [hoursPerWeek, setHoursPerWeek] = useState(15);
  const [availableDays, setAvailableDays] = useState<number[]>(DEFAULT_DAYS);
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [loading, setLoading] = useState(false);

  const hasExamDate = !!(edital.exam_date && edital.exam_date.trim());
  const [dateInput, setDateInput] = useState(() => {
    if (hasExamDate) {
      // Convert ISO date (YYYY-MM-DD) to DD/MM/YYYY for display
      const [y, m, d] = edital.exam_date.split('-');
      return d && m && y ? `${d}/${m}/${y}` : '';
    }
    return '';
  });

  const concursoName = `${edital.orgao} - ${edital.cargo}`;

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

  const toggleDay = (dayIndex: number) => {
    setAvailableDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex].sort(),
    );
  };

  const handleGenerate = () => {
    if (availableDays.length === 0) return;

    // If no exam date from edital, parse from user input
    let finalEdital = edital;
    if (!hasExamDate) {
      const parsed = parseUserDate(dateInput);
      if (!parsed) {
        // No date entered → use 12-week fallback (API handles this)
        finalEdital = { ...edital, exam_date: '' };
      } else {
        finalEdital = { ...edital, exam_date: parsed };
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const config: ScheduleConfig = {
        hours_per_week: hoursPerWeek,
        available_days: availableDays,
        preferred_time: preferredTime,
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
          Analisando {edital.disciplinas.length} disciplinas e seus pesos
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

        {/* Hours per week */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="time-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Horas por semana</Text>
          </View>
          <Stepper
            value={hoursPerWeek}
            min={5}
            max={40}
            onDecrement={() => setHoursPerWeek((v) => Math.max(5, v - 1))}
            onIncrement={() => setHoursPerWeek((v) => Math.min(40, v + 1))}
          />
        </Card>

        {/* Available days */}
        <Card style={styles.card}>
          <View style={styles.fieldHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
            <Text style={styles.fieldLabel}>Dias disponíveis</Text>
          </View>
          <View style={styles.dayPillsContainer}>
            {DAY_LABELS.map((label, index) => {
              const isSelected = availableDays.includes(index);
              return (
                <Pressable
                  key={label}
                  onPress={() => toggleDay(index)}
                  style={styles.dayPillWrapper}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[colors.accent, colors.accentPink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.dayPill}
                    >
                      <Text style={styles.dayPillTextSelected}>{label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.dayPillInactive}>
                      <Text style={styles.dayPillText}>{label}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
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
                  // Auto-format: insert slashes after DD and MM
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
                <Text style={styles.disciplinaWeight}>Peso {d.weight}</Text>
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
  dayPillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  dayPillWrapper: {
    flex: 1,
  },
  dayPill: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillInactive: {
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dayPillText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  dayPillTextSelected: {
    color: colors.text,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
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
