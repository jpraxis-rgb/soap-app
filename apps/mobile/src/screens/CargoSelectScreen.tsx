import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { showAlert } from '../utils/alert';
import { Card, Badge } from '../components';
import { createEditalFromTemplate } from '../services/api';
import type { ParsedEditalData } from '../contexts/ConcursoContext';

interface Disciplina {
  id: string;
  name: string;
  weight: number;
  topics: string[];
  category?: 'geral' | 'especifico';
}

interface Cargo {
  name: string;
  disciplinas: Disciplina[];
}

interface CargoSelectParams {
  editalBase: {
    id: string;
    banca: string;
    orgao: string;
    exam_date: string;
    confidence: number;
    sourceUrl?: string;
  };
  cargos: Cargo[];
  sharedDisciplinas: Disciplina[];
  templateId?: string;
}

const normalizeDisciplinas = (discs: any[]) => discs.map((d: any) => ({
  id: d.id || `d-${Math.random().toString(36).slice(2)}`,
  name: d.name || '',
  weight: d.weight ?? null,
  topics: Array.isArray(d.topics) ? d.topics : d.topics?.items || [],
}));

export function CargoSelectScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { editalBase, cargos, sharedDisciplinas, templateId } = route.params as CargoSelectParams;
  const [loadingCargo, setLoadingCargo] = useState<string | null>(null);

  const handleSelectCargo = async (cargo: Cargo) => {
    if (loadingCargo) return;

    if (templateId) {
      setLoadingCargo(cargo.name);
      try {
        const result = await createEditalFromTemplate(templateId, cargo.name);
        const parsed = result.edital?.parsedData || {};
        const apiDisciplinas = result.disciplinas || [];
        const normalized = normalizeDisciplinas(apiDisciplinas);

        const edital: ParsedEditalData = {
          id: result.edital?.id || `edital-${Date.now()}`,
          banca: parsed.banca || editalBase.banca,
          orgao: parsed.orgao || editalBase.orgao,
          exam_date: parsed.exam_date || result.edital?.examDate || editalBase.exam_date,
          confidence: 1.0,
          cargo: cargo.name,
          disciplinas: normalized,
          sourceUrl: editalBase.sourceUrl,
        };
        navigation.navigate('EditalReview', { edital });
      } catch (err: any) {
        showAlert('Erro', err?.message || 'Falha ao criar edital.');
      } finally {
        setLoadingCargo(null);
      }
      return;
    }

    const edital = {
      ...editalBase,
      cargo: cargo.name,
      sourceUrl: editalBase.sourceUrl,
      disciplinas: [
        ...sharedDisciplinas.map(d => ({ ...d, category: 'geral' as const })),
        ...cargo.disciplinas.map(d => ({ ...d, category: 'especifico' as const })),
      ],
    };
    navigation.navigate('EditalReview', { edital });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Ionicons name="business-outline" size={22} color={colors.accent} />
            <Text style={styles.orgaoName}>{editalBase.orgao}</Text>
          </View>
          <Badge text={editalBase.banca} color={colors.accent + '40'} />
        </View>

        {/* Subtitle */}
        <Text style={styles.subtitle}>Selecione o cargo desejado</Text>

        {/* Cargo List */}
        {cargos.map((cargo, index) => {
          const geraisCount = sharedDisciplinas.length;
          const especificasCount = cargo.disciplinas.length;
          const disciplinaLabel = geraisCount > 0 && especificasCount > 0
            ? `${geraisCount} gerais + ${especificasCount} espec\u00edficas`
            : geraisCount > 0
              ? `${geraisCount} disciplinas compartilhadas`
              : `${especificasCount} ${especificasCount === 1 ? 'disciplina' : 'disciplinas'}`;

          return (
            <Pressable key={index} onPress={() => handleSelectCargo(cargo)} disabled={loadingCargo !== null}>
              <Card style={styles.cargoCard}>
                <View style={styles.cargoRow}>
                  <View style={styles.cargoInfo}>
                    <Text style={styles.cargoName}>{cargo.name}</Text>
                    <Text style={styles.cargoMeta}>{disciplinaLabel}</Text>
                  </View>
                  {loadingCargo === cargo.name ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </View>
              </Card>
            </Pressable>
          );
        })}
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  orgaoName: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  cargoCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  cargoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cargoInfo: {
    flex: 1,
    gap: 2,
  },
  cargoName: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  cargoMeta: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
});
