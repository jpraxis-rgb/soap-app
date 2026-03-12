import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { parseEdital, getEditalTemplates, getEditalTemplateDetail, createEditalFromTemplate } from '../services/api';
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

export function EditalImportScreen() {
  const navigation = useNavigation<any>();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EditalTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [tappedTemplateId, setTappedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    getEditalTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setTemplatesLoading(false));
  }, []);

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

  const handleAnalyze = async () => {
    if (!url.trim()) {
      Alert.alert('URL obrigatoria', 'Cole a URL do edital para continuar.');
      return;
    }

    setLoading(true);
    try {
      const result = await parseEdital(url.trim()) as any;
      const parsed = result.edital?.parsedData || result.parsedData || {};
      const apiDisciplinas = result.disciplinas || [];
      const cargos: Array<{ name: string; disciplinas: any[] }> = parsed.cargos || [];
      const sharedDisciplinas = normalizeDisciplinas(apiDisciplinas);

      const hasCargoDisciplinas = cargos.some(c => c.disciplinas?.length > 0);
      if (sharedDisciplinas.length === 0 && !hasCargoDisciplinas) {
        const warnings = result.warnings || parsed.warnings || [];
        const warningMsg = warnings.length > 0
          ? warnings[0].replace(/^Gemini.*?:\s*/, '').substring(0, 150)
          : 'Nenhuma disciplina encontrada no edital.';
        Alert.alert('Analise incompleta', `Nao foi possivel extrair disciplinas do edital.\n\n${warningMsg}`);
        return;
      }

      const editalBase = {
        id: result.edital?.id || result.id || `edital-${Date.now()}`,
        banca: parsed.banca || '',
        orgao: parsed.orgao || '',
        exam_date: parsed.exam_date || result.edital?.examDate || '',
        confidence: parsed.confidence || 0,
      };

      if (cargos.length > 1) {
        const normalizedCargos = cargos.map(c => ({
          name: c.name,
          disciplinas: c.disciplinas?.length > 0 ? normalizeDisciplinas(c.disciplinas) : [],
        }));
        navigation.navigate('CargoSelect', { editalBase, cargos: normalizedCargos, sharedDisciplinas });
        return;
      }

      const cargoDisciplinas = cargos.length === 1 && cargos[0].disciplinas?.length > 0
        ? normalizeDisciplinas(cargos[0].disciplinas)
        : [];

      const mergedDisciplinas = [
        ...sharedDisciplinas.map(d => ({ ...d, category: 'geral' as const })),
        ...cargoDisciplinas.map(d => ({ ...d, category: 'especifico' as const })),
      ];

      const edital: ParsedEditalData = {
        ...editalBase,
        cargo: cargos.length === 1 ? cargos[0].name : parsed.cargo || '',
        disciplinas: mergedDisciplinas.length > 0 ? mergedDisciplinas : sharedDisciplinas,
      };

      navigation.navigate('EditalReview', { edital });
    } catch (err: any) {
      Alert.alert('Erro ao analisar', err?.message || 'Nao foi possivel analisar o edital. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPDF = () => {
    Alert.alert('Em breve', 'O upload de PDF estar\u00e1 dispon\u00edvel em uma pr\u00f3xima atualiza\u00e7\u00e3o.');
  };

  const top3 = templates.slice(0, 3);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <Ionicons name="document-text-outline" size={48} color={colors.accent} />
          <Text style={styles.title}>Importar Edital</Text>
          <Text style={styles.subtitle}>
            Adicione um concurso ao seu plano de estudos
          </Text>
        </View>

        {/* Popular Templates */}
        <Text style={styles.sectionTitle}>Concursos em Andamento</Text>

        {templatesLoading ? (
          <View style={styles.shimmerContainer}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.shimmerCard} />
            ))}
          </View>
        ) : top3.length > 0 ? (
          <>
            {top3.map(template => (
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
                        {template.banca} · {formatExamDate(template.examDate) ? `Prova ${formatExamDate(template.examDate)}` : template.orgao}
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
            ))}

            {templates.length > 3 && (
              <Pressable
                style={styles.verTodosButton}
                onPress={() => navigation.navigate('EditalPicker')}
              >
                <Text style={styles.verTodosText}>Ver todos os concursos</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.accent} />
              </Pressable>
            )}
          </>
        ) : null}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou importe seu</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* URL Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>URL do Edital</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="link-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Cole a URL do edital aqui"
              placeholderTextColor={colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />
          </View>
        </View>

        {/* Analyze Button */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Analisando edital com IA...</Text>
          </View>
        ) : (
          <Pressable onPress={handleAnalyze} style={styles.buttonWrapper}>
            <LinearGradient
              colors={[colors.accent, colors.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="search-outline" size={20} color={colors.text} />
              <Text style={styles.buttonText}>Analisar</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* Upload PDF Button */}
        <Pressable onPress={handleUploadPDF} style={styles.outlinedButton}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          <Text style={styles.outlinedButtonText}>Fazer upload do PDF</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerArea: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  shimmerContainer: {
    gap: spacing.sm,
  },
  shimmerCard: {
    height: 72,
    backgroundColor: colors.card,
    borderRadius: 12,
    opacity: 0.5,
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
  verTodosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  verTodosText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  inputContainer: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inputLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingVertical: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  buttonWrapper: {
    marginTop: spacing.lg,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: spacing.md,
  },
  outlinedButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
