import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card } from '../components';
import { logStudySession, type ScheduleBlockData } from '../services/api';
import { showAlert } from '../utils/alert';

// ── Types ──────────────────────────────────────────────

type Step = 'topic' | 'timer' | 'post';

interface StudySessionScreenProps {
  navigation: { goBack: () => void; reset: (state: any) => void };
  route: {
    params: {
      block: ScheduleBlockData;
    };
  };
}

// ── Rating Options ─────────────────────────────────────

const RATINGS = [
  { value: 1, label: 'Difícil', icon: 'sad-outline' as const, color: '#FF4757' },
  { value: 2, label: 'OK', icon: 'happy-outline' as const, color: '#FFB347' },
  { value: 3, label: 'Fácil', icon: 'sparkles' as const, color: '#00D4AA' },
];

// ── Timer Helpers ──────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Main Screen ────────────────────────────────────────

export function StudySessionScreen({ navigation, route }: StudySessionScreenProps) {
  const { block } = route.params;

  // Step 1: Topic selection
  const [step, setStep] = useState<Step>('topic');
  const [selectedTopic, setSelectedTopic] = useState(block.topic);

  // Step 2: Timer
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startedAtRef = useRef<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedElapsedRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef<Date | null>(null);

  // Step 3: Post-session
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Handle app state changes (backgrounding) — not available on web
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (step !== 'timer') return;

      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // Going to background — record time
        backgroundTimeRef.current = new Date();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // Coming back from background
        if (!isPaused && backgroundTimeRef.current) {
          const bgSeconds = Math.floor((Date.now() - backgroundTimeRef.current.getTime()) / 1000);
          setElapsed((prev) => prev + bgSeconds);
        }
        backgroundTimeRef.current = null;
        if (!isPaused) {
          startInterval();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [step, isPaused]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
  }, []);

  const startTimer = () => {
    startedAtRef.current = new Date();
    setElapsed(0);
    setIsPaused(false);
    startInterval();
    setStep('timer');
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      startInterval();
    } else {
      // Pause
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const finishTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStep('post');
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSaveSession = async () => {
    if (rating === null) {
      showAlert('Avaliação', 'Selecione como foi a sessão.');
      return;
    }

    setSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.round(elapsed / 60));
      await logStudySession({
        schedule_block_id: block.id,
        disciplina_id: block.disciplina_id,
        topic: selectedTopic,
        duration_minutes: durationMinutes,
        self_rating: rating,
        notes: notes.trim() || undefined,
        started_at: startedAtRef.current?.toISOString() || new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });

      showAlert(
        'Sessão salva!',
        `${durationMinutes} minutos de ${block.disciplina_name} registrados.`,
      );
      navigation.goBack();
    } catch (err: any) {
      showAlert('Erro', err?.message || 'Não foi possível salvar a sessão.');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1: Topic Selection ───────────────────────

  if (step === 'topic') {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Iniciar sessão</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.disciplinaTitle}>{block.disciplina_name}</Text>
          <Text style={styles.selectLabel}>Selecione o tópico:</Text>

          <Pressable
            style={[styles.topicOption, selectedTopic === block.topic && styles.topicOptionSelected]}
            onPress={() => setSelectedTopic(block.topic)}
          >
            <Ionicons
              name={selectedTopic === block.topic ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedTopic === block.topic ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.topicOptionText, selectedTopic === block.topic && styles.topicOptionTextSelected]}>
              {block.topic}
            </Text>
            <Text style={styles.topicBadge}>Agendado</Text>
          </Pressable>

          <View style={styles.infoCard}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {block.duration_minutes} minutos planejados • {block.start_time}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottomAction}>
          <Pressable onPress={startTimer} style={styles.startButtonWrapper}>
            <LinearGradient
              colors={[colors.accent, colors.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButton}
            >
              <Ionicons name="play" size={24} color={colors.text} />
              <Text style={styles.startButtonText}>Iniciar timer</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Step 2: Timer ─────────────────────────────────

  if (step === 'timer') {
    const targetSeconds = block.duration_minutes * 60;
    const progress = Math.min(elapsed / targetSeconds, 1);

    return (
      <View style={styles.timerContainer}>
        <View style={styles.topBar}>
          <View style={{ width: 40 }} />
          <Text style={styles.topBarTitle}>{block.disciplina_name}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.timerContent}>
          <Text style={styles.timerTopic}>{selectedTopic}</Text>

          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
            <Text style={styles.timerTarget}>
              Meta de Estudo: {block.duration_minutes}min
            </Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[colors.accent, colors.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>

          <View style={styles.timerControls}>
            <Pressable onPress={togglePause} style={styles.timerButton}>
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={32}
                color={colors.text}
              />
              <Text style={styles.timerButtonLabel}>
                {isPaused ? 'Continuar' : 'Pausar'}
              </Text>
            </Pressable>

            <Pressable onPress={finishTimer} style={styles.finishButton}>
              <Ionicons name="stop" size={32} color="#FF4757" />
              <Text style={[styles.timerButtonLabel, { color: '#FF4757' }]}>
                Finalizar
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ── Step 3: Post-Session ──────────────────────────

  const durationMinutes = Math.max(1, Math.round(elapsed / 60));

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <Text style={styles.topBarTitle}>Sessão concluída</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.completedSummary}>
          <Ionicons name="checkmark-circle" size={48} color={colors.success} />
          <Text style={styles.completedTitle}>{durationMinutes} minutos</Text>
          <Text style={styles.completedSubtitle}>
            {block.disciplina_name} • {selectedTopic}
          </Text>
        </View>

        {/* Rating */}
        <Card style={styles.ratingCard}>
          <Text style={styles.ratingLabel}>Como foi a sessão?</Text>
          <View style={styles.ratingOptions}>
            {RATINGS.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRating(r.value)}
                style={[
                  styles.ratingOption,
                  rating === r.value && { backgroundColor: r.color + '20', borderColor: r.color },
                ]}
              >
                <Ionicons
                  name={r.icon}
                  size={28}
                  color={rating === r.value ? r.color : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.ratingOptionLabel,
                    rating === r.value && { color: r.color },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {/* Notes */}
        <Card style={styles.notesCard}>
          <Text style={styles.notesLabel}>Anotações</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="O que você aprendeu? Dúvidas?"
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Card>
      </ScrollView>

      <View style={styles.bottomAction}>
        <Pressable
          onPress={handleSaveSession}
          disabled={saving}
          style={styles.startButtonWrapper}
        >
          <LinearGradient
            colors={rating !== null ? [colors.accent, colors.accentPink] : [colors.surface, colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButton}
          >
            <Ionicons
              name="checkmark"
              size={24}
              color={rating !== null ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.startButtonText, rating === null && { color: colors.textSecondary }]}>
              {saving ? 'Salvando...' : 'Salvar sessão'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  timerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl * 2,
  },
  disciplinaTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  selectLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.sm,
  },
  topicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.surface,
    marginBottom: spacing.sm,
  },
  topicOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  topicOptionText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    flex: 1,
  },
  topicOptionTextSelected: {
    fontWeight: typography.weights.semibold,
  },
  topicBadge: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.card,
    marginTop: spacing.sm,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  bottomAction: {
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
  startButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: 12,
  },
  startButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  // Timer styles
  timerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  timerTopic: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  timerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  timerText: {
    color: colors.text,
    fontSize: 64,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  timerTarget: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xxl,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  timerControls: {
    flexDirection: 'row',
    gap: spacing.xxl,
  },
  timerButton: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  finishButton: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
  },
  timerButtonLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  // Post-session styles
  completedSummary: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  completedTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  completedSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  ratingCard: {
    marginBottom: spacing.md,
  },
  ratingLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surface,
    backgroundColor: colors.card,
  },
  ratingOptionLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  notesCard: {
    marginBottom: spacing.md,
  },
  notesLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  notesInput: {
    color: colors.text,
    fontSize: typography.sizes.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    minHeight: 100,
  },
});
