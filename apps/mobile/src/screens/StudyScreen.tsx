import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components';
import { fetchContentByTopic, ContentItem } from '../services/api';

type FormatTab = 'summary' | 'flashcard' | 'quiz' | 'mind_map';

const TABS: { key: FormatTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'summary', label: 'Resumo', icon: 'document-text' },
  { key: 'flashcard', label: 'Flashcards', icon: 'layers' },
  { key: 'quiz', label: 'Quiz', icon: 'help-circle' },
  { key: 'mind_map', label: 'Mapa Mental', icon: 'git-branch' },
];

export function StudyScreen() {
  const [activeTab, setActiveTab] = useState<FormatTab>('summary');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  async function loadContent() {
    setLoading(true);
    try {
      const data = await fetchContentByTopic('all', activeTab);
      setItems(data);
    } catch {
      setItems([]);
    }
    setLoading(false);
  }

  function handleItemPress(item: ContentItem) {
    switch (item.format) {
      case 'summary':
        navigation.navigate('Content', { item });
        break;
      case 'flashcard':
        navigation.navigate('Flashcard', { item });
        break;
      case 'quiz':
        navigation.navigate('Quiz', { item });
        break;
      case 'mind_map':
        navigation.navigate('Content', { item, mode: 'mindmap' });
        break;
    }
  }

  function renderItem({ item }: { item: ContentItem }) {
    return (
      <Pressable onPress={() => handleItemPress(item)}>
        <Card style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatBadgeText}>
                {TABS.find((t) => t.key === item.format)?.label || item.format}
              </Text>
            </View>
            {item.professor_name && (
              <Text style={styles.professorText}>{item.professor_name}</Text>
            )}
          </View>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemTopic}>{item.topic}</Text>
          <View style={styles.itemFooter}>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={styles.tabButton}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={tab.icon}
                  size={20}
                  color={activeTab === tab.key ? colors.text : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
              {activeTab === tab.key && (
                <LinearGradient
                  colors={[colors.accent, colors.accentPink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.tabIndicator}
                />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content list */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhum conteúdo disponível</Text>
          <Text style={styles.emptySubtext}>
            Conteúdos serão adicionados pelo professor
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContainer: {
    backgroundColor: colors.card,
    paddingTop: spacing.sm,
  },
  tabScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  tabButton: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.semibold,
  },
  tabIndicator: {
    height: 3,
    width: '100%',
    borderRadius: 1.5,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.md,
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
  formatBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  formatBadgeText: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  professorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  itemTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  itemTopic: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  itemFooter: {
    alignItems: 'flex-end',
    marginTop: spacing.sm,
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
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
