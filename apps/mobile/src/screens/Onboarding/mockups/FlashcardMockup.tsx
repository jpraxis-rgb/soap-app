import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../../theme';

const contentTypes = [
  { label: 'Flashcard', active: true },
  { label: 'Resumo', active: false },
  { label: 'Quiz', active: false },
];

export function FlashcardMockup() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Content type chips */}
      <View style={styles.chipRow}>
        {contentTypes.map((type, index) => (
          <View
            key={index}
            style={[
              styles.chip,
              type.active && { backgroundColor: colors.accent },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                type.active && { color: '#FFFFFF' },
              ]}
            >
              {type.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Flashcard with gradient top border */}
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardBorder}
        />
        <View style={styles.card}>
          <Text style={styles.categoryLabel}>Dir. Constitucional</Text>
          <Text style={styles.questionText}>
            O que é o princípio da legalidade?
          </Text>
        </View>
      </View>

      {/* Answer preview */}
      <View style={styles.answerPreview}>
        <Ionicons name="lock-closed" size={10} color={colors.textSecondary} />
        <Text style={styles.answerPreviewText}>Toque para ver a resposta</Text>
      </View>

      {/* Difficulty indicator */}
      <View style={styles.difficultySection}>
        <Text style={styles.difficultyTitle}>Dificuldade</Text>
        <View style={styles.difficultyRow}>
          <View style={[styles.difficultyDot, { backgroundColor: colors.success }]} />
          <View style={[styles.difficultyDotActive, { backgroundColor: colors.warning }]} />
          <View style={[styles.difficultyDot, { backgroundColor: colors.error }]} />
          <Text style={styles.difficultyLabel}>Médio</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>Progresso</Text>
          <Text style={styles.progressCount}>12/30</Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={10} color={colors.success} />
          <Text style={styles.statText}>8 corretas</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle" size={10} color={colors.error} />
          <Text style={styles.statText}>3 erradas</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="remove-circle" size={10} color={colors.textSecondary} />
          <Text style={styles.statText}>1 pulada</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    chipRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 10,
    },
    chip: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    chipText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    cardWrapper: {
      width: '100%',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 8,
    },
    cardBorder: {
      height: 3,
    },
    card: {
      backgroundColor: colors.surface,
      padding: 14,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 70,
    },
    categoryLabel: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    questionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    answerPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: 8,
      gap: 6,
      marginBottom: 10,
    },
    answerPreviewText: {
      fontSize: 10,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    difficultySection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    difficultyTitle: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
    },
    difficultyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    difficultyDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      opacity: 0.4,
    },
    difficultyDotActive: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    difficultyLabel: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.textSecondary,
      marginLeft: 2,
    },
    progressSection: {
      marginBottom: 10,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    progressText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
    },
    progressCount: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    progressTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    progressFill: {
      width: '40%',
      height: '100%',
      borderRadius: 2,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 9,
      fontWeight: '500',
      color: colors.textSecondary,
    },
  });
