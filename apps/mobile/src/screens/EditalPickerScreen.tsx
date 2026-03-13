import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { showAlert } from '../utils/alert';
import { getEditalTemplates, getEditalTemplateDetail, createEditalFromTemplate } from '../services/api';
import type { EditalTemplate } from '../services/api';
import type { ParsedEditalData } from '../contexts/ConcursoContext';
import { Card, Badge } from '../components';

function formatExamDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function isNewTemplate(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

const normalizeDisciplinas = (discs: any[]) => discs.map((d: any) => ({
  id: d.id || `d-${Math.random().toString(36).slice(2)}`,
  name: d.name || '',
  weight: d.weight ?? null,
  topics: Array.isArray(d.topics) ? d.topics : d.topics?.items || [],
}));

type SortMode = 'newest' | 'examDate' | 'alpha';
type NivelFilter = 'todos' | 'superior' | 'medio';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'newest', label: 'Recentes' },
  { key: 'examDate', label: 'Data da prova' },
  { key: 'alpha', label: 'A-Z' },
];

const NIVEL_OPTIONS: { key: NivelFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'superior', label: 'Nível Superior' },
  { key: 'medio', label: 'Nível Médio' },
];

function sortTemplates(list: EditalTemplate[], mode: SortMode): EditalTemplate[] {
  return [...list].sort((a, b) => {
    switch (mode) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'examDate': {
        if (!a.examDate && !b.examDate) return 0;
        if (!a.examDate) return 1;
        if (!b.examDate) return -1;
        return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
      }
      case 'alpha':
        return a.name.localeCompare(b.name, 'pt-BR');
      default:
        return 0;
    }
  });
}

export function EditalPickerScreen() {
  const navigation = useNavigation<any>();
  const [templates, setTemplates] = useState<EditalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [nivelFilter, setNivelFilter] = useState<NivelFilter>('todos');
  const [tappedTemplateId, setTappedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    getEditalTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = templates;
    if (nivelFilter !== 'todos') {
      list = list.filter(t => t.nivel === nivelFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.name.toLowerCase().includes(q) ||
          t.banca.toLowerCase().includes(q) ||
          t.orgao.toLowerCase().includes(q),
      );
    }
    return sortTemplates(list, sortMode);
  }, [templates, search, sortMode, nivelFilter]);

  const handleTemplatePress = async (template: EditalTemplate) => {
    if (tappedTemplateId) return;
    setTappedTemplateId(template.id);

    try {
      if (template.hasCargos) {
        const detail = await getEditalTemplateDetail(template.id);
        const sharedDisciplinas = normalizeDisciplinas(detail.disciplinas);
        const normalizedCargos = (detail.cargos || []).map(c => ({
          name: c.name,
          disciplinas: c.disciplinas?.length > 0 ? normalizeDisciplinas(c.disciplinas) : [],
        }));
        navigation.navigate('CargoSelect', {
          editalBase: {
            id: `template-${template.id}`,
            banca: detail.banca,
            orgao: detail.orgao,
            exam_date: detail.examDate || '',
            confidence: 1.0,
            sourceUrl: template.sourceUrl,
          },
          cargos: normalizedCargos,
          sharedDisciplinas,
          templateId: template.id,
        });
      } else {
        const result = await createEditalFromTemplate(template.id);
        const parsed = result.edital?.parsedData || {};
        const apiDisciplinas = result.disciplinas || [];
        const sharedDisciplinas = normalizeDisciplinas(apiDisciplinas);

        const edital: ParsedEditalData = {
          id: result.edital?.id || `edital-${Date.now()}`,
          banca: parsed.banca || template.banca,
          orgao: parsed.orgao || template.orgao,
          exam_date: parsed.exam_date || result.edital?.examDate || '',
          confidence: 1.0,
          cargo: parsed.cargo || '',
          disciplinas: sharedDisciplinas,
          sourceUrl: template.sourceUrl || undefined,
        };
        navigation.navigate('EditalReview', { edital });
      }
    } catch (err: any) {
      showAlert('Erro', err?.message || 'Falha ao carregar template.');
    } finally {
      setTappedTemplateId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar concurso..."
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Sort Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
          contentContainerStyle={styles.sortRowContent}
        >
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setSortMode(opt.key)}
              style={[
                styles.sortPill,
                sortMode === opt.key && styles.sortPillActive,
              ]}
            >
              <Text
                style={[
                  styles.sortPillText,
                  sortMode === opt.key && styles.sortPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Nivel Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortRow}
          contentContainerStyle={styles.sortRowContent}
        >
          {NIVEL_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              onPress={() => setNivelFilter(opt.key)}
              style={[
                styles.sortPill,
                nivelFilter === opt.key && styles.sortPillActive,
              ]}
            >
              <Text
                style={[
                  styles.sortPillText,
                  nivelFilter === opt.key && styles.sortPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum concurso encontrado</Text>
          </View>
        ) : (
          filtered.map(template => (
            <Pressable
              key={template.id}
              onPress={() => handleTemplatePress(template)}
              disabled={tappedTemplateId !== null}
            >
              <Card style={styles.templateCard}>
                <View style={styles.templateRow}>
                  <View style={styles.templateInfo}>
                    <View style={styles.templateNameRow}>
                      <Text style={styles.templateName} numberOfLines={1}>{template.name}</Text>
                      {isNewTemplate(template.createdAt) && (
                        <Badge text="Novo" color={colors.success + '30'} />
                      )}
                    </View>
                    <Text style={styles.templateMeta}>
                      {template.banca} · {formatExamDate(template.examDate) || template.orgao}{template.vagas ? ` · ${template.vagas} vagas` : ''}
                    </Text>
                  </View>
                  <View style={styles.templateRight}>
                    {tappedTemplateId === template.id ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        {/* Footer CTA */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Não encontrou?</Text>
          <Pressable
            style={styles.footerLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.footerLinkText}>Importe seu edital</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surface,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingVertical: 12,
  },
  sortRow: {
    marginBottom: spacing.md,
  },
  sortRowContent: {
    gap: spacing.sm,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  sortPillActive: {
    backgroundColor: colors.accent + '20',
    borderColor: colors.accent,
  },
  sortPillText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sortPillTextActive: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  templateCard: {
    marginBottom: spacing.sm,
  },
  templateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
    gap: 2,
  },
  templateNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  templateName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    flexShrink: 1,
  },
  templateMeta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  templateRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerLinkText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
