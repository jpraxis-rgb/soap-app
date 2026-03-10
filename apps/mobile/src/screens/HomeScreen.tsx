import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { Badge, Card } from '../components';
import { getTodayScheduleBlocks, ScheduleBlockData } from '../services/api';
import { SessionLogSheet } from './SessionLogSheet';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Week Calendar ──────────────────────────────────────

function WeekCalendar() {
  const today = new Date();
  const days = [];
  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  // Start from Monday of this week
  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startOfWeek.setDate(today.getDate() + mondayOffset);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  return (
    <View style={calStyles.container}>
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        return (
          <View key={i} style={calStyles.dayColumn}>
            <Text style={[calStyles.dayLabel, isToday && calStyles.dayLabelActive]}>
              {dayLabels[(mondayOffset + i + dayOfWeek + 7) % 7 === 0 ? 0 : ((mondayOffset + i + dayOfWeek + 7) % 7)]}
            </Text>
            {isToday ? (
              <LinearGradient
                colors={[colors.accent, colors.accentPink]}
                style={calStyles.todayCircle}
              >
                <Text style={calStyles.dayNumberActive}>{d.getDate()}</Text>
              </LinearGradient>
            ) : (
              <View style={calStyles.dayCircle}>
                <Text style={calStyles.dayNumber}>{d.getDate()}</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const calStyles = StyleSheet.create({
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
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
});

// ── Study Block Card ───────────────────────────────────

function StudyBlockCard({
  block,
  onStartSession,
}: {
  block: ScheduleBlockData;
  onStartSession: (block: ScheduleBlockData) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const isCompleted = block.status === 'completed';

  return (
    <Pressable onPress={toggleExpand}>
      <Card style={[blockStyles.card, isCompleted && blockStyles.cardCompleted]}>
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
            <Badge
              text={`Peso ${block.weight}`}
              color={colors.accent + '40'}
            />
            {block.has_content && (
              <Badge text="Material disponivel" color={colors.success + '30'} />
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
            <Text style={blockStyles.completedText}>Concluido</Text>
          </View>
        )}

        {expanded && !isCompleted && (
          <View style={blockStyles.actions}>
            <Pressable
              style={blockStyles.actionButton}
              onPress={() => onStartSession(block)}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentPink]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={blockStyles.gradientButton}
              >
                <Ionicons name="play" size={16} color={colors.text} />
                <Text style={blockStyles.actionText}>Iniciar sessao</Text>
              </LinearGradient>
            </Pressable>
            <Pressable style={blockStyles.outlinedButton}>
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

const blockStyles = StyleSheet.create({
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

export function HomeScreen() {
  const [blocks, setBlocks] = useState<ScheduleBlockData[]>([]);
  const [sessionBlock, setSessionBlock] = useState<ScheduleBlockData | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  React.useEffect(() => {
    getTodayScheduleBlocks().then(setBlocks);
  }, []);

  // Exam countdown - mock date 90 days from now
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 90);
  const daysUntilExam = Math.ceil(
    (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const pendingCount = blocks.filter((b) => b.status === 'pending').length;
  const completedCount = blocks.filter((b) => b.status === 'completed').length;
  const totalMinutes = blocks.reduce((s, b) => s + b.duration_minutes, 0);

  const handleStartSession = (block: ScheduleBlockData) => {
    setSessionBlock(block);
    setSheetVisible(true);
  };

  const handleCloseSheet = () => {
    setSheetVisible(false);
    setSessionBlock(null);
  };

  const handleSessionLogged = () => {
    setSheetVisible(false);
    setSessionBlock(null);
    // Refresh blocks
    getTodayScheduleBlocks().then(setBlocks);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
            colors={[colors.accent, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.countdownCard}
          >
            <View style={styles.countdownLeft}>
              <Text style={styles.countdownLabel}>Dias ate a prova</Text>
              <Text style={styles.countdownNumber}>{daysUntilExam}</Text>
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
        </View>

        {/* Week Calendar */}
        <WeekCalendar />

        {/* Today's Blocks Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Blocos de hoje</Text>
          <Text style={styles.sectionCount}>
            {completedCount}/{blocks.length} concluidos
          </Text>
        </View>

        {/* Study Block Cards */}
        {blocks.map((block) => (
          <StudyBlockCard
            key={block.id}
            block={block}
            onStartSession={handleStartSession}
          />
        ))}

        {blocks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum bloco para hoje</Text>
            <Text style={styles.emptySubtext}>
              Configure seu cronograma para comecar
            </Text>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Session Log Bottom Sheet */}
      {sessionBlock && (
        <SessionLogSheet
          isVisible={sheetVisible}
          onClose={handleCloseSheet}
          onSessionLogged={handleSessionLogged}
          block={sessionBlock}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  countdownLeft: {},
  countdownLabel: {
    color: 'rgba(255,255,255,0.8)',
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
});
