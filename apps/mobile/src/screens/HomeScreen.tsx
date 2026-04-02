import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Badge, Card } from '../components';
import { getTodayScheduleBlocks, ScheduleBlockData, getUpcomingScheduleBlocks, getStudySessions, StudySessionData } from '../services/api';
import { useConcurso } from '../contexts/ConcursoContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);
  return reduceMotion;
}

// ── Week Calendar ──────────────────────────────────────

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function WeekCalendar({
  selectedDate,
  onSelectDate,
  blockDates,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  blockDates: Set<string>;
}) {
  const { colors } = useTheme();
  const calStyles = createCalStyles(colors);
  const today = new Date();
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Start from Monday of this week
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + mondayOffset);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  return (
    <View style={calStyles.container}>
      {days.map((d, i) => {
        const dateKey = formatDateKey(d);
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = dateKey === selectedDate;
        const hasBlocks = blockDates.has(dateKey);

        return (
          <Pressable key={i} onPress={() => onSelectDate(dateKey)} style={calStyles.dayColumn}>
            <Text style={[calStyles.dayLabel, (isToday || isSelected) && calStyles.dayLabelActive]}>
              {dayLabels[d.getDay()]}
            </Text>
            {isSelected ? (
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={calStyles.todayCircle}
              >
                <Text style={calStyles.dayNumberActive}>{d.getDate()}</Text>
              </LinearGradient>
            ) : (
              <View style={[calStyles.dayCircle, isToday && { borderWidth: 1, borderColor: colors.accent }]}>
                <Text style={[calStyles.dayNumber, isToday && { color: colors.accent }]}>{d.getDate()}</Text>
              </View>
            )}
            {hasBlocks && !isSelected && (
              <View style={calStyles.dotIndicator} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const createCalStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
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
  todayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dayNumber: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  dayNumberActive: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
});

// ── Study Block Card ───────────────────────────────────

function StudyBlockCard({
  block,
  onStartSession,
  onViewMaterial,
}: {
  block: ScheduleBlockData;
  onStartSession: (block: ScheduleBlockData) => void;
  onViewMaterial: (block: ScheduleBlockData) => void;
}) {
  const { colors } = useTheme();
  const blockStyles = createBlockStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  const toggleExpand = () => {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setExpanded(!expanded);
  };

  const isCompleted = block.status === 'completed';

  return (
    <Pressable onPress={toggleExpand}>
      <Card style={[blockStyles.card, isCompleted ? blockStyles.cardCompleted : undefined]}>
        <View style={blockStyles.header}>
          <View style={blockStyles.timeContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={isCompleted ? colors.success : colors.textSecondary}
            />
            <Text style={[blockStyles.time, isCompleted && blockStyles.timeCompleted]}>
              {block.start_time}
            </Text>
            <Text style={blockStyles.duration}>{block.duration_minutes}min</Text>
          </View>
          <View style={blockStyles.badges}>
            {block.weight != null && block.weight > 0 && (
              <Badge
                text={`Peso ${block.weight}`}
                color={colors.accent + '40'}
              />
            )}
            {block.has_content && (
              <Badge text="Material disponível" color={colors.success + '30'} />
            )}
          </View>
        </View>

        <Text style={[blockStyles.disciplina, isCompleted && blockStyles.disciplinaCompleted]}>
          {block.disciplina_name}
        </Text>
        <Text style={blockStyles.topic}>{block.topic}</Text>

        {isCompleted && (
          <View style={blockStyles.completedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={blockStyles.completedText}>Concluído</Text>
          </View>
        )}

        {expanded && !isCompleted && (
          <View style={blockStyles.actions}>
            <Pressable
              style={blockStyles.actionButton}
              onPress={() => onStartSession(block)}
            >
              <View style={[blockStyles.gradientButton, { backgroundColor: colors.accent }]}>
                <Ionicons name="play" size={16} color={colors.accentForeground} />
                <Text style={[blockStyles.actionText, { color: colors.accentForeground }]}>Iniciar sessão</Text>
              </View>
            </Pressable>
            <Pressable style={blockStyles.outlinedButton} onPress={() => onViewMaterial(block)}>
              <Ionicons name="document-text-outline" size={16} color={colors.accent} />
              <Text style={blockStyles.outlinedText}>Ver material</Text>
            </Pressable>
          </View>
        )}

        {expanded && isCompleted && (
          <View style={blockStyles.actions}>
            <Pressable style={blockStyles.outlinedButton}>
              <Ionicons name="refresh" size={16} color={colors.accent} />
              <Text style={blockStyles.outlinedText}>Revisar</Text>
            </Pressable>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const createBlockStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cardCompleted: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  timeCompleted: {
    color: colors.success,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  disciplina: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  disciplinaCompleted: {
    textDecorationLine: 'line-through',
  },
  topic: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  completedText: {
    color: colors.success,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  actionButton: {
    flex: 1,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  outlinedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  outlinedText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});

// ── Main Home Screen ───────────────────────────────────

interface HomeScreenProps {
  navigation: { navigate: (screen: string, params?: any) => void };
}

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { hasAnyConcurso, hasActiveSchedule, activeConcurso, concursos, setActiveConcurso, getScheduleConfig } = useConcurso();
  const [allWeekBlocks, setAllWeekBlocks] = useState<ScheduleBlockData[]>([]);
  const [daySessions, setDaySessions] = useState<StudySessionData[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConcursoSelector, setShowConcursoSelector] = useState(false);
  const reduceMotion = useReducedMotion();

  // Compute week range (Mon-Sun)
  const weekRange = React.useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: formatDateKey(monday), to: formatDateKey(sunday) };
  }, []);

  React.useEffect(() => {
    if (!hasAnyConcurso) {
      setLoading(false);
      setAllWeekBlocks([]);
      setDaySessions([]);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      getUpcomingScheduleBlocks(weekRange.from, weekRange.to),
      getStudySessions({ from: weekRange.from + 'T00:00:00Z', to: weekRange.to + 'T23:59:59Z' }).catch(() => [] as StudySessionData[]),
    ])
      .then(([blocks, sessions]) => {
        setAllWeekBlocks(blocks);
        setDaySessions(sessions);
      })
      .catch(() => setError('Não foi possível carregar os blocos.'))
      .finally(() => setLoading(false));
  }, [hasAnyConcurso, activeConcurso?.id, weekRange.from, weekRange.to]);

  // Filter blocks for selected date
  const blocks = allWeekBlocks.filter(b => b.scheduled_date === selectedDate);
  // Filter manual sessions for selected date
  const sessionsForDate = daySessions.filter(s => s.started_at?.startsWith(selectedDate));
  // Dates that have blocks (for calendar dots)
  const blockDates = React.useMemo(
    () => new Set(allWeekBlocks.map(b => b.scheduled_date)),
    [allWeekBlocks],
  );

  // Exam countdown from active concurso's exam date
  const examDateStr = activeConcurso?.edital?.exam_date;
  const examDate = examDateStr ? new Date(examDateStr) : null;
  const daysUntilExam = examDate && !isNaN(examDate.getTime())
    ? Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const pendingCount = blocks.filter((b) => b.status === 'pending').length;
  const completedCount = blocks.filter((b) => b.status === 'completed').length;
  const totalMinutes = blocks.reduce((s, b) => s + b.duration_minutes, 0);

  const handleStartSession = (block: ScheduleBlockData) => {
    navigation.navigate('StudySession', { block });
  };

  const handleViewMaterial = (block: ScheduleBlockData) => {
    navigation.navigate('Estudar', {
      screen: 'StudyMain',
      initial: false,
      params: {
        focusDiscipline: block.disciplina_name,
      },
    });
  };

  const handleEditSchedule = async () => {
    if (!activeConcurso) return;
    const existingConfig = await getScheduleConfig(activeConcurso.id);
    navigation.navigate('ScheduleConfig', {
      edital: activeConcurso.edital,
      isEditing: true,
      existingConfig,
    });
  };

  // Empty state: no concurso imported yet
  if (!hasAnyConcurso) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <Ionicons name="school-outline" size={80} color={colors.surface} />
          <Text style={styles.emptyTitle}>Bem-vindo ao SOAP!</Text>
          <Text style={styles.tagline}>Sistema Operacional do Aprovado</Text>
          <Text style={styles.emptyDescription}>
            Escolha um concurso popular ou importe seu edital para começar a estudar de forma inteligente.
          </Text>
          <Pressable onPress={() => navigation.navigate('EditalImport')}>
            <View style={[styles.importButton, { backgroundColor: colors.accent }]}>
              <Ionicons name="add-circle-outline" size={20} color={colors.accentForeground} />
              <Text style={[styles.importButtonText, { color: colors.accentForeground }]}>Selecionar concurso</Text>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={() => {
            setLoading(true);
            setError(null);
            getUpcomingScheduleBlocks(weekRange.from, weekRange.to)
              .then(setAllWeekBlocks)
              .catch(() => setError('Não foi possível carregar os blocos.'))
              .finally(() => setLoading(false));
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Concurso Selector (multi-concurso) */}
        {concursos.length > 1 && (
          <View style={styles.concursoSelectorWrapper}>
            <Pressable
              style={styles.concursoSelector}
              onPress={() => {
                if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setShowConcursoSelector(!showConcursoSelector);
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.concursoSelectorLabel}>Concurso ativo</Text>
                <Text style={styles.concursoSelectorName} numberOfLines={1}>
                  {activeConcurso?.edital?.orgao || 'Concurso'} — {activeConcurso?.edital?.cargo || ''}
                </Text>
              </View>
              <Ionicons
                name={showConcursoSelector ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>
            {showConcursoSelector && (
              <View style={styles.concursoDropdown}>
                {concursos.map(c => (
                  <Pressable
                    key={c.id}
                    style={[
                      styles.concursoOption,
                      c.id === activeConcurso?.id && styles.concursoOptionActive,
                    ]}
                    onPress={() => {
                      setActiveConcurso(c.id);
                      if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setShowConcursoSelector(false);
                    }}
                  >
                    <Text style={styles.concursoOptionText} numberOfLines={1}>
                      {c.edital.orgao} — {c.edital.cargo}
                    </Text>
                    {c.id === activeConcurso?.id && (
                      <Ionicons name="checkmark" size={18} color={colors.accent} />
                    )}
                  </Pressable>
                ))}
                <Pressable
                  style={styles.concursoAddOption}
                  onPress={() => {
                    setShowConcursoSelector(false);
                    navigation.navigate('EditalImport');
                  }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                  <Text style={styles.concursoAddText}>Adicionar concurso</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Bom dia!</Text>
          <Text style={styles.greetingSubtext}>
            {pendingCount} blocos pendentes hoje
          </Text>
        </View>

        {/* Exam Countdown Card */}
        <View style={styles.countdownWrapper}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.countdownCard}
          >
            <View style={styles.countdownLeft}>
              <Text style={styles.countdownLabel}>
                {daysUntilExam != null ? 'Dias até a prova' : 'Resumo'}
              </Text>
              <Text style={styles.countdownNumber}>
                {daysUntilExam != null ? daysUntilExam : `${blocks.length}`}
              </Text>
              {daysUntilExam == null && (
                <Text style={styles.countdownLabel}>blocos agendados</Text>
              )}
            </View>
            <View style={styles.countdownRight}>
              <View style={styles.countdownStat}>
                <Text style={styles.countdownStatValue}>{completedCount}/{blocks.length}</Text>
                <Text style={styles.countdownStatLabel}>blocos hoje</Text>
              </View>
              <View style={styles.countdownStat}>
                <Text style={styles.countdownStatValue}>{Math.round(totalMinutes / 60 * 10) / 10}h</Text>
                <Text style={styles.countdownStatLabel}>planejado</Text>
              </View>
            </View>
          </LinearGradient>
          {(hasActiveSchedule || allWeekBlocks.length > 0) && (
            <Pressable
              style={styles.editScheduleRow}
              onPress={handleEditSchedule}
              accessibilityLabel="Editar cronograma"
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={14} color={colors.accent} />
              <Text style={styles.editScheduleText}>Editar cronograma</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Week Calendar */}
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          blockDates={blockDates}
        />

        {/* Blocks Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {selectedDate === formatDateKey(new Date()) ? 'Blocos de hoje' : `Blocos de ${selectedDate.split('-').reverse().join('/')}`}
          </Text>
          <Text style={styles.sectionCount}>
            {completedCount}/{blocks.length} {completedCount === 1 ? 'concluído' : 'concluídos'}
          </Text>
        </View>

        {/* Study Block Cards */}
        {blocks.map((block) => (
          <StudyBlockCard
            key={block.id}
            block={block}
            onStartSession={handleStartSession}
            onViewMaterial={handleViewMaterial}
          />
        ))}

        {/* Manual Sessions */}
        {sessionsForDate.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessões registradas</Text>
              <Text style={styles.sectionCount}>{sessionsForDate.length}</Text>
            </View>
            {sessionsForDate.map((session) => {
              const ratingIcons = ['', 'thunderstorm-outline', 'partly-sunny-outline', 'sunny-outline'] as const;
              const ratingColors = ['', '#FF6B6B', '#FFB347', '#4ECB71'];
              const time = session.started_at ? new Date(session.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
              return (
                <Pressable
                  key={session.id}
                  onPress={() => navigation.navigate('ManualSession', { session })}
                >
                  <Card style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <Ionicons name="time-outline" size={16} color={colors.success} />
                        <Text style={{ color: colors.success, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium }}>{time}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>{session.duration_minutes}min</Text>
                      </View>
                      {session.self_rating >= 1 && session.self_rating <= 3 && (
                        <Ionicons
                          name={ratingIcons[session.self_rating] as any}
                          size={18}
                          color={ratingColors[session.self_rating]}
                        />
                      )}
                    </View>
                    <Text style={{ color: colors.text, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, marginBottom: spacing.xs }}>
                      {session.disciplina_name || 'Disciplina'}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.sm }}>{session.topic}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={{ color: colors.success, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium }}>Registrado</Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </>
        )}

        {blocks.length === 0 && sessionsForDate.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum bloco neste dia</Text>
            <Text style={styles.emptySubtext}>
              {blockDates.size > 0 ? 'Selecione um dia com blocos no calendário acima' : 'Importe um edital e gere seu cronograma'}
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* FAB — Manual Session */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('ManualSession')}
        accessibilityLabel="Registrar sessão manualmente"
        accessibilityRole="button"
      >
        <View style={[styles.fabGradient, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={28} color={colors.accentForeground} />
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  greeting: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greetingText: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  greetingSubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  countdownWrapper: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  countdownCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: spacing.lg,
  },
  editScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  editScheduleText: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  countdownLeft: {},
  countdownLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  countdownNumber: {
    color: colors.text,
    fontSize: typography.sizes.xxxl + 10,
    fontWeight: typography.weights.bold,
    lineHeight: typography.sizes.xxxl + 16,
  },
  countdownRight: {
    gap: spacing.sm,
  },
  countdownStat: {
    alignItems: 'flex-end',
  },
  countdownStatValue: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  countdownStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  retryText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl * 2,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  tagline: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.5,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  importButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  concursoSelectorWrapper: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  concursoSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
  },
  concursoSelectorLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  concursoSelectorName: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginTop: 2,
  },
  concursoDropdown: {
    backgroundColor: colors.card,
    borderRadius: 12,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  concursoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  concursoOptionActive: {
    backgroundColor: colors.surface,
  },
  concursoOptionText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  concursoAddOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  concursoAddText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
