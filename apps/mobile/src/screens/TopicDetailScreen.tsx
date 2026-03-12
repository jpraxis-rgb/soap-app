import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components';
import { TopicContent, DisciplineContent, fetchContentForTopic } from '../services/api';

type FormatInfo = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
};

const FORMATS: FormatInfo[] = [
  { key: 'summary', label: 'Resumo', icon: 'document-text', color: '#7C5CFC', screen: 'Content' },
  { key: 'flashcard', label: 'Flash', icon: 'layers', color: '#FF6B9D', screen: 'Flashcard' },
  { key: 'quiz', label: 'Quiz', icon: 'help-circle', color: '#FFB347', screen: 'Quiz' },
  { key: 'mind_map', label: 'Mapa', icon: 'git-branch', color: '#00D4AA', screen: 'Content' },
];

function StatusBadge({ status }: { status: string }) {
  const config = {
    complete: { label: 'Completo', bg: colors.success + '25', color: colors.success },
    in_progress: { label: 'Em progresso', bg: colors.accent + '25', color: colors.accent },
    new: { label: 'Novo', bg: colors.surface, color: colors.textSecondary },
  }[status] ?? { label: status, bg: colors.surface, color: colors.textSecondary };

  return (
    <View style={[badgeStyles.badge, { backgroundColor: config.bg }]}>
      <Text style={[badgeStyles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
});

export function TopicDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ TopicDetail: { discipline: DisciplineContent } }, 'TopicDetail'>>();
  const { discipline } = route.params;

  const percent = discipline.topicCount > 0
    ? Math.round((discipline.completedCount / discipline.topicCount) * 100)
    : 0;

  const handleFormatPress = useCallback(async (topic: TopicContent, format: FormatInfo) => {
    const contentId = topic.formats[format.key as keyof typeof topic.formats];
    if (!contentId) return;

    try {
      // Fetch the actual content item
      const items = await fetchContentForTopic(topic.name, discipline.name, format.key);
      const item = items.find((i: any) => i.id === contentId) || items[0];
      if (!item) return;

      if (format.key === 'mind_map') {
        navigation.navigate('Content', { item, mode: 'mindmap' });
      } else {
        navigation.navigate(format.screen, { item });
      }
    } catch {
      // Could show error toast
    }
  }, [discipline.name, navigation]);

  function renderTopic({ item }: { item: TopicContent }) {
    return (
      <Card style={styles.topicCard}>
        <View style={styles.topicHeader}>
          <Text style={styles.topicName} numberOfLines={2}>{item.name}</Text>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.formatsRow}>
          {FORMATS.map((format) => {
            const hasContent = !!item.formats[format.key as keyof typeof item.formats];
            return (
              <Pressable
                key={format.key}
                style={[
                  styles.formatButton,
                  { borderColor: hasContent ? format.color + '60' : colors.surface },
                  hasContent && { backgroundColor: format.color + '15' },
                ]}
                onPress={() => hasContent && handleFormatPress(item, format)}
                disabled={!hasContent}
              >
                <Ionicons
                  name={format.icon}
                  size={20}
                  color={hasContent ? format.color : colors.textSecondary + '60'}
                />
                <Text
                  style={[
                    styles.formatLabel,
                    { color: hasContent ? format.color : colors.textSecondary + '60' },
                  ]}
                >
                  {format.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {/* Discipline progress header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.headerPercent}>{percent}%</Text>
          <Text style={styles.headerDetail}>
            {discipline.completedCount}/{discipline.topicCount} tópicos
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <LinearGradient
            colors={[colors.accent, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${Math.max(percent, 2)}%` }]}
          />
        </View>
      </View>

      <FlatList
        data={discipline.topics}
        keyExtractor={(item) => item.name}
        renderItem={renderTopic}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerPercent: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  headerDetail: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  topicCard: {
    marginBottom: 0,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topicName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  formatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    height: 64,
  },
  formatLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
});
