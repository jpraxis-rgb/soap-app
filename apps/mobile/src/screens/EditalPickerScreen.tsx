import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { getEditalTemplates, getEditalTemplateDetail, createEditalFromTemplate } from '../services/api';
import type { EditalTemplate } from '../services/api';
import type { ParsedEditalData } from '../contexts/ConcursoContext';
import { Card } from '../components';

const normalizeDisciplinas = (discs: any[]) => discs.map((d: any) => ({
  id: d.id || `d-${Math.random().toString(36).slice(2)}`,
  name: d.name || '',
  weight: d.weight || 1,
  topics: Array.isArray(d.topics) ? d.topics : d.topics?.items || [],
}));

export function EditalPickerScreen() {
  const navigation = useNavigation<any>();
  const [templates, setTemplates] = useState<EditalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tappedTemplateId, setTappedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    getEditalTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      t =>
        t.name.toLowerCase().includes(q) ||
        t.banca.toLowerCase().includes(q) ||
        t.orgao.toLowerCase().includes(q),
    );
  }, [templates, search]);

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
        };
        navigation.navigate('EditalReview', { edital });
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Falha ao carregar template.');
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
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateMeta}>
                      {template.banca} · {template.orgao}
                    </Text>
                  </View>
                  <View style={styles.templateRight}>
                    {tappedTemplateId === template.id ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <>
                        <Text style={styles.templateCount}>
                          {template.disciplinaCount} discipl.
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                      </>
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}

        {/* Footer CTA */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Nao encontrou?</Text>
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
  templateName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
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
  templateCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
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
