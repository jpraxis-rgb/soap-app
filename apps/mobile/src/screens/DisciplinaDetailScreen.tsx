import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card, Badge } from '../components';
import {
  getDisciplinaDetail,
  DisciplinaProgressData,
  StudySessionData,
} from '../services/api';

// ── Topic Checklist ────────────────────────────────────

function TopicItem({ name, completed }: { name: string; completed: boolean }) {
  const { colors } = useTheme();
  const topicStyles = createTopicStyles(colors);
  return (
    <View style={topicStyles.row}>
      <Ionicons
        name={completed ? 'checkmark-circle' : 'ellipse-outline'}
        size={20}
        color={completed ? colors.success : colors.textSecondary}
      />
      <Text
        style={[
          topicStyles.name,
          completed && topicStyles.nameCompleted,
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

const createTopicStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  name: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
  nameCompleted: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});

// ── Session History Item ───────────────────────────────

function SessionItem({ session, onPress }: { session: StudySessionData; onPress?: () => void }) {
  const { colors } = useTheme();
  const sessionStyles = createSessionStyles(colors);
  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  const ratingIcons: { icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
    { icon: 'thunderstorm-outline', color: '#FF6B6B' },
    { icon: 'partly-sunny-outline', color: '#FFB347' },
    { icon: 'sunny-outline', color: '#4ECB71' },
  ];
  const rating = ratingIcons[session.self_rating - 1] || ratingIcons[1];

  return (
    <Pressable style={sessionStyles.row} onPress={onPress}>
      <View style={sessionStyles.left}>
        <Text style={sessionStyles.topic} numberOfLines={1}>
          {session.topic}
        </Text>
        <View style={sessionStyles.metaRow}>
          <Text style={sessionStyles.date}>{dateStr}</Text>
          {session.notes ? (
            <View style={sessionStyles.notesBadge}>
              <Ionicons name="document-text-outline" size={10} color={colors.textSecondary} />
              <Text style={sessionStyles.notesPreview} numberOfLines={1}>
                {session.notes}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={sessionStyles.right}>
        <Text style={sessionStyles.duration}>{session.duration_minutes}min</Text>
        <Ionicons name={rating.icon} size={18} color={rating.color} />
      </View>
    </Pressable>
  );
}

const createSessionStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  left: {
    flex: 1,
    marginRight: spacing.sm,
  },
  topic: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  date: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  notesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  notesPreview: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  duration: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});

// ── Main Screen ────────────────────────────────────────

export function DisciplinaDetailScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { disciplinaId, disciplinaName } = route.params || {
    disciplinaId: 'd1',
    disciplinaName: 'Disciplina',
  };

  const [disciplina, setDisciplina] = useState<DisciplinaProgressData | null>(null);
  const [sessions, setSessions] = useState<StudySessionData[]>([]);
  const [topics, setTopics] = useState<{ name: string; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    getDisciplinaDetail(disciplinaId)
      .then((result) => {
        setDisciplina(result.disciplina);
        setSessions(result.sessions);
        setTopics(result.topics);
      })
      .catch(() => setError('Não foi possível carregar a disciplina.'))
      .finally(() => setLoading(false));
  }, [disciplinaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  if (error || !disciplina) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Erro ao carregar dados.'}</Text>
      </View>
    );
  }

  const completedTopics = topics.filter((t) => t.completed).length;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.headerTitle}>{disciplinaName}</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{disciplina.hours_studied}h</Text>
              <Text style={styles.headerStatLabel}>estudadas</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{disciplina.progress_percent}%</Text>
              <Text style={styles.headerStatLabel}>progresso</Text>
            </View>
            <View style={styles.headerDivider} />
            <View style={styles.headerStat}>
              <Text style={styles.headerStatValue}>{disciplina.session_count}</Text>
              <Text style={styles.headerStatLabel}>sessões</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        {disciplina.weight != null && disciplina.weight > 0 && (
          <View style={styles.infoItem}>
            <Ionicons name="scale-outline" size={16} color={colors.accent} />
            <Text style={styles.infoText}>Peso {disciplina.weight}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color={colors.accent} />
          <Text style={styles.infoText}>
            {disciplina.hours_studied}h / {disciplina.hours_planned}h
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="star-outline" size={16} color={colors.warning} />
          <Text style={styles.infoText}>
            Avaliação: {disciplina.avg_rating.toFixed(1)}/3
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <Card style={styles.section} header="Progresso">
        <View style={styles.progressBarOuter}>
          <View
            style={[
              styles.progressBarInner,
              { width: `${Math.min(disciplina.progress_percent, 100)}%` },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            {disciplina.completed_blocks} de {disciplina.total_blocks} blocos concluídos
          </Text>
          <Text style={styles.progressPercent}>{disciplina.progress_percent}%</Text>
        </View>
      </Card>

      {/* Topics Checklist */}
      <Card style={styles.section} header={`Tópicos (${completedTopics}/${topics.length})`}>
        {topics.map((topic, i) => (
          <TopicItem key={i} name={topic.name} completed={topic.completed} />
        ))}
      </Card>

      {/* Session History */}
      <Card style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderText}>Histórico de sessões</Text>
          <Pressable
            style={styles.addSessionButton}
            onPress={() =>
              navigation.navigate('ManualSession', { disciplinaId, disciplinaName })
            }
            accessibilityLabel="Adicionar sessão"
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onPress={() => navigation.navigate('ManualSession', { session, disciplinaId, disciplinaName })}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma sessão registrada</Text>
        )}
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
  headerCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: spacing.lg,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatValue: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  headerStatLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  headerDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  section: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  progressBarOuter: {
    height: 10,
    backgroundColor: colors.surface,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarInner: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  progressPercent: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeaderText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  addSessionButton: {
    padding: spacing.xs,
  },
});
