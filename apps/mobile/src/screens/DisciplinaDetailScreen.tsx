import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme';
import { Card, Badge } from '../components';
import {
  getDisciplinaDetail,
  DisciplinaProgressData,
  StudySessionData,
} from '../services/api';

// ── Topic Checklist ────────────────────────────────────

function TopicItem({ name, completed }: { name: string; completed: boolean }) {
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

const topicStyles = StyleSheet.create({
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

function SessionItem({ session }: { session: StudySessionData }) {
  const date = new Date(session.started_at);
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
  const ratingEmojis = ['\u{1F629}', '\u{1F610}', '\u{1F60A}'];
  const ratingEmoji = ratingEmojis[session.self_rating - 1] || '\u{1F610}';

  return (
    <View style={sessionStyles.row}>
      <View style={sessionStyles.left}>
        <Text style={sessionStyles.topic} numberOfLines={1}>
          {session.topic}
        </Text>
        <Text style={sessionStyles.date}>{dateStr}</Text>
      </View>
      <View style={sessionStyles.right}>
        <Text style={sessionStyles.duration}>{session.duration_minutes}min</Text>
        <Text style={sessionStyles.rating}>{ratingEmoji}</Text>
      </View>
    </View>
  );
}

const sessionStyles = StyleSheet.create({
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
  date: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
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
  rating: {
    fontSize: 18,
  },
});

// ── Main Screen ────────────────────────────────────────

export function DisciplinaDetailScreen() {
  const route = useRoute<any>();
  const { disciplinaId, disciplinaName } = route.params || {
    disciplinaId: 'd1',
    disciplinaName: 'Disciplina',
  };

  const [disciplina, setDisciplina] = useState<DisciplinaProgressData | null>(null);
  const [sessions, setSessions] = useState<StudySessionData[]>([]);
  const [topics, setTopics] = useState<{ name: string; completed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          colors={[colors.accent, colors.accentPink]}
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
      <Card style={styles.section} header="Histórico de sessões">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhuma sessão registrada</Text>
        )}
      </Card>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  headerDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
});
