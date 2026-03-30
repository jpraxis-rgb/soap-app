import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card } from '../components';
import { useConcurso } from '../contexts/ConcursoContext';
import { fetchContentForEdital, DisciplineContent, EditalContentMap } from '../services/api';

export function StudyScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { activeConcurso } = useConcurso();
  const [contentMap, setContentMap] = useState<EditalContentMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = createStyles(colors);

  const loadContent = useCallback(async () => {
    if (!activeConcurso?.id) {
      setContentMap(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await fetchContentForEdital(activeConcurso.id);
      setContentMap(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[StudyScreen] fetch error:', msg);
      setError(msg);
      setContentMap(null);
    }
    setLoading(false);
    setRefreshing(false);
  }, [activeConcurso?.id]);

  useEffect(() => {
    setLoading(true);
    loadContent();
  }, [loadContent]);

  useFocusEffect(useCallback(() => {
    loadContent();
  }, [loadContent]));

  // Use API data, or fall back to local discipline data from the concurso
  const displayMap = useMemo<EditalContentMap | null>(() => {
    if (contentMap) return contentMap;
    if (!activeConcurso?.edital?.disciplinas?.length) return null;
    return {
      disciplines: activeConcurso.edital.disciplinas.map(d => ({
        name: d.name,
        topicCount: Array.isArray(d.topics) ? d.topics.length : 0,
        completedCount: 0,
        topics: (Array.isArray(d.topics) ? d.topics : []).map((t: string) => ({
          name: t,
          status: 'new' as const,
          formats: {},
        })),
      })),
    };
  }, [contentMap, activeConcurso]);

  // Auto-navigate to discipline when coming from HomeScreen "Ver material"
  useEffect(() => {
    const focusDiscipline = route.params?.focusDiscipline;
    if (focusDiscipline && displayMap?.disciplines) {
      const disc = displayMap.disciplines.find(d => d.name === focusDiscipline);
      if (disc) {
        navigation.navigate('TopicDetail', { discipline: disc });
        navigation.setParams({ focusDiscipline: undefined });
      }
    }
  }, [route.params?.focusDiscipline, displayMap]);

  const totalTopics = displayMap?.disciplines.reduce((s, d) => s + d.topicCount, 0) ?? 0;
  const completedTopics = displayMap?.disciplines.reduce((s, d) => s + d.completedCount, 0) ?? 0;
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  function handleDisciplinePress(discipline: DisciplineContent) {
    navigation.navigate('TopicDetail', { discipline });
  }

  function renderDiscipline({ item }: { item: DisciplineContent }) {
    const percent = item.topicCount > 0 ? Math.round((item.completedCount / item.topicCount) * 100) : 0;

    return (
      <Pressable onPress={() => handleDisciplinePress(item)}>
        <Card style={styles.disciplineCard}>
          <View style={styles.disciplineHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.disciplineName}>{item.name}</Text>
              <Text style={styles.disciplineTopicCount}>
                {item.topicCount} {item.topicCount === 1 ? 'tópico' : 'tópicos'}
              </Text>
            </View>
            <View style={styles.percentContainer}>
              <Text style={styles.percentText}>{percent}%</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: `${Math.max(percent, 2)}%` }]}
            />
          </View>
        </Card>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!activeConcurso) {
    return (
      <View style={styles.centered}>
        <Ionicons name="school-outline" size={64} color={colors.surface} />
        <Text style={styles.emptyTitle}>Nenhum concurso selecionado</Text>
        <Text style={styles.emptySubtext}>Importe um edital para começar a estudar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall progress */}
      <View style={styles.overallContainer}>
        <Text style={styles.overallLabel}>Progresso geral</Text>
        <Text style={styles.overallPercent}>{overallPercent}%</Text>
        <View style={styles.overallBarBg}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.overallBarFill, { width: `${Math.max(overallPercent, 2)}%` }]}
          />
        </View>
        <Text style={styles.overallDetail}>
          {completedTopics} de {totalTopics} tópicos completos
        </Text>
      </View>

      {/* Discipline list */}
      <FlatList
        data={displayMap?.disciplines ?? []}
        keyExtractor={(item) => item.name}
        renderItem={renderDiscipline}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadContent();
            }}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {error ? 'Erro ao carregar conteúdo' : 'Nenhum conteúdo disponível'}
            </Text>
            <Text style={styles.emptySubtext}>
              {error || 'Os materiais de estudo serão gerados em breve'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  overallContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  overallLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  overallPercent: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.xs,
  },
  overallBarBg: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  overallBarFill: {
    height: 6,
    borderRadius: 3,
  },
  overallDetail: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  disciplineCard: {
    marginBottom: 0,
  },
  disciplineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  disciplineName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  disciplineTopicCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  percentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  percentText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
