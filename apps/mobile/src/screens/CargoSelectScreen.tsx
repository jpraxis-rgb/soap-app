import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { Card, Badge } from '../components';

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
  };
  cargos: Cargo[];
  sharedDisciplinas: Disciplina[];
}

export function CargoSelectScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { editalBase, cargos, sharedDisciplinas } = route.params as CargoSelectParams;

  const handleSelectCargo = (cargo: Cargo) => {
    const edital = {
      ...editalBase,
      cargo: cargo.name,
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
            <Pressable key={index} onPress={() => handleSelectCargo(cargo)}>
              <Card style={styles.cargoCard}>
                <View style={styles.cargoRow}>
                  <View style={styles.cargoInfo}>
                    <Text style={styles.cargoName}>{cargo.name}</Text>
                    <Text style={styles.cargoMeta}>{disciplinaLabel}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
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
