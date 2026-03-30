import React from 'react';
import { View, Text, StyleSheet, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../../theme';

const disciplines = [
  { name: 'Dir. Constitucional', topics: 4, weight: '18%' },
  { name: 'Português', topics: 3, weight: '15%' },
  { name: 'Rac. Lógico', topics: 3, weight: '12%' },
  { name: 'Dir. Administrativo', topics: 5, weight: '20%' },
  { name: 'Informática', topics: 2, weight: '10%' },
];

export function EditalMockup() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Document card */}
      <View style={styles.docCard}>
        <View style={styles.docStripe} />
        <Ionicons name="document-text" size={16} color={colors.accent} />
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>edital_trt5.pdf</Text>
          <Text style={styles.docSize}>2.4 MB · 48 páginas</Text>
        </View>
        <View style={styles.docBadge}>
          <Text style={styles.docBadgeText}>PDF</Text>
        </View>
      </View>

      {/* Analysis complete */}
      <View style={styles.successRow}>
        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
        <Text style={styles.successText}>Análise concluída</Text>
      </View>

      {/* Discipline list */}
      <View style={styles.disciplineList}>
        {disciplines.map((d, index) => (
          <View key={index} style={styles.disciplineRow}>
            <View
              style={[
                styles.bullet,
                { backgroundColor: index % 2 === 0 ? colors.accent : colors.accentSecondary },
              ]}
            />
            <Text style={styles.disciplineName}>{d.name}</Text>
            <Text style={styles.topicCount}>{d.topics} tópicos</Text>
          </View>
        ))}
      </View>

      {/* Weight distribution mini bar chart */}
      <View style={styles.weightSection}>
        <Text style={styles.weightTitle}>Distribuição de peso</Text>
        <View style={styles.weightBars}>
          {disciplines.map((d, index) => (
            <View key={index} style={styles.weightBarRow}>
              <Text style={styles.weightLabel}>{d.name.substring(0, 3)}</Text>
              <View style={styles.weightTrack}>
                <View style={{ width: d.weight as DimensionValue, height: '100%' }}>
                  <LinearGradient
                    colors={
                      index % 2 === 0
                        ? [colors.gradientStart, colors.gradientEnd]
                        : [colors.accentSecondary, colors.accentSecondary]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.weightFill}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Summary badge */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>5 disciplinas · 17 tópicos</Text>
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
    docCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 6,
      gap: 8,
      marginBottom: 8,
    },
    docStripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: colors.accent,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    docInfo: {
      flex: 1,
    },
    docName: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
    },
    docSize: {
      fontSize: 9,
      color: colors.textSecondary,
      marginTop: 1,
    },
    docBadge: {
      backgroundColor: colors.accent + '20',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    docBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: colors.accent,
    },
    successRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    successText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.success,
    },
    disciplineList: {
      gap: 5,
      marginBottom: 10,
    },
    disciplineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    disciplineName: {
      flex: 1,
      fontSize: 11,
      fontWeight: '500',
      color: colors.text,
    },
    topicCount: {
      fontSize: 9,
      color: colors.textSecondary,
    },
    weightSection: {
      marginBottom: 10,
    },
    weightTitle: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    weightBars: {
      gap: 4,
    },
    weightBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    weightLabel: {
      fontSize: 8,
      fontWeight: '500',
      color: colors.textSecondary,
      width: 20,
    },
    weightTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    weightFill: {
      flex: 1,
      borderRadius: 2,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accent + '20',
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: colors.accent,
    },
  });
