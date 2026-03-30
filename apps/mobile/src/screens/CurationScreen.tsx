import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card, Badge, Button } from '../components';
import {
  fetchCurationQueue,
  approveContent,
  rejectContent,
  ContentItem,
} from '../services/api';

export function CurationScreen() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const FORMAT_LABELS: Record<string, string> = {
    summary: 'Resumo',
    flashcard: 'Flashcards',
    quiz: 'Quiz',
    mind_map: 'Mapa Mental',
  };

  const FORMAT_COLORS: Record<string, string> = {
    summary: colors.accent,
    flashcard: colors.warning,
    quiz: colors.accentSecondary,
    mind_map: colors.success,
  };

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurationQueue();
      setItems(data);
    } catch {
      setError('Não foi possível carregar a fila de curadoria.');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const result = await approveContent(id);
      if (result) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível aprovar o conteúdo.');
    }
  }

  function handleReject(id: string) {
    Alert.alert(
      'Rejeitar conteúdo',
      'Tem certeza que deseja rejeitar este conteúdo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rejeitar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await rejectContent(id);
              if (result) {
                setItems((prev) => prev.filter((item) => item.id !== id));
              }
            } catch {
              Alert.alert('Erro', 'Não foi possível rejeitar o conteúdo.');
            }
          },
        },
      ]
    );
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  function getPreviewText(item: ContentItem): string {
    const body = item.body as any;
    if (item.format === 'summary' && body?.sections?.[0]?.content) {
      return body.sections[0].content.substring(0, 200) + '...';
    }
    if (item.format === 'flashcard' && body?.cards?.[0]) {
      return `Pergunta: ${body.cards[0].front}\nResposta: ${body.cards[0].back}`;
    }
    if (item.format === 'quiz' && body?.questions?.[0]) {
      return `${body.questions[0].question}\n(${body.questions.length} questões)`;
    }
    if (item.format === 'mind_map' && body?.centralNode) {
      return `Nó central: ${body.centralNode}\n${body.branches?.length || 0} ramificações`;
    }
    return 'Sem preview disponível';
  }

  function renderItem({ item }: { item: ContentItem }) {
    const isExpanded = expandedId === item.id;

    return (
      <Card style={styles.itemCard}>
        <Pressable onPress={() => toggleExpand(item.id)}>
          <View style={styles.itemHeader}>
            <Badge
              text={FORMAT_LABELS[item.format] || item.format}
              color={FORMAT_COLORS[item.format] || colors.accent}
            />
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemTopic}>{item.topic}</Text>
        </Pressable>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview</Text>
              <Text style={styles.previewText}>{getPreviewText(item)}</Text>
            </View>

            <View style={styles.actionButtons}>
              <Button
                label="Rejeitar"
                onPress={() => handleReject(item.id)}
                variant="outlined"
                style={styles.rejectButton}
              />
              <Button
                label="Aprovar"
                onPress={() => handleApprove(item.id)}
                style={styles.approveButton}
              />
            </View>
          </View>
        )}
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Curadoria</Text>
        <Text style={styles.headerCount}>
          {items.length} {items.length === 1 ? 'item' : 'itens'} pendente
          {items.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkmark-circle"
            size={48}
            color={colors.success}
          />
          <Text style={styles.emptyText}>Tudo revisado!</Text>
          <Text style={styles.emptySubtext}>
            Não há conteúdos pendentes de revisão
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  headerCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemCard: {
    marginBottom: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  itemTopic: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  previewContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  previewLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  previewText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectButton: {
    flex: 1,
    borderColor: colors.error,
  },
  approveButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
