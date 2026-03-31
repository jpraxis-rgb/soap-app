import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../../theme';

const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

const scheduleBlocks = [
  { discipline: 'Dir. Constitucional', time: '08:00 – 09:30', accent: 'primary' as const },
  { discipline: 'Português', time: '10:00 – 11:30', accent: 'secondary' as const },
  { discipline: 'Rac. Lógico', time: '14:00 – 15:00', accent: 'success' as const },
];

export function HomeMockup() {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getAccentColor = (accent: string) => {
    if (accent === 'primary') return colors.accent;
    if (accent === 'secondary') return colors.accentSecondary;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      {/* Countdown card at top */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.countdownCard}
      >
        <View style={styles.countdownLeft}>
          <Ionicons name="calendar-outline" size={12} color="#FFFFFFCC" />
          <Text style={styles.countdownText}>
            <Text style={styles.countdownNumber}>87</Text> dias até a prova
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Text style={styles.percentText}>76%</Text>
        </View>
      </LinearGradient>

      {/* Week calendar strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((day, index) => (
          <View
            key={index}
            style={[
              styles.dayCell,
              index === 2 && styles.dayCellActive,
            ]}
          >
            <Text
              style={[
                styles.dayText,
                index === 2 && styles.dayTextActive,
              ]}
            >
              {day}
            </Text>
            {index === 2 && <Text style={styles.hojeLabel}>hoje</Text>}
          </View>
        ))}
      </View>

      {/* Section label */}
      <Text style={styles.sectionLabel}>Sessões de hoje</Text>

      {/* Schedule blocks */}
      {scheduleBlocks.map((block, index) => (
        <View
          key={index}
          style={[
            styles.scheduleCard,
            { borderLeftColor: getAccentColor(block.accent) },
          ]}
        >
          <View style={styles.scheduleHeader}>
            <Text style={styles.disciplineText}>{block.discipline}</Text>
            <View style={[styles.statusDot, index === 0 && { backgroundColor: colors.success }]} />
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={9} color={colors.textSecondary} />
            <Text style={styles.timeText}>{block.time}</Text>
          </View>
        </View>
      ))}

      {/* Quick stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>sessões</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>4.5h</Text>
          <Text style={styles.statLabel}>estudo</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>tópicos</Text>
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
    countdownCard: {
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    countdownLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    countdownText: {
      fontSize: 10,
      fontWeight: '500',
      color: '#FFFFFFCC',
    },
    countdownNumber: {
      fontSize: 16,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    percentBadge: {
      backgroundColor: '#FFFFFF30',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    percentText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    weekStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    dayCell: {
      width: 22,
      height: 28,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCellActive: {
      backgroundColor: colors.accent,
    },
    dayText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    dayTextActive: {
      color: '#FFFFFF',
    },
    hojeLabel: {
      fontSize: 7,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: -1,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 6,
    },
    scheduleCard: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 6,
      marginBottom: 5,
      borderLeftWidth: 3,
    },
    scheduleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    disciplineText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    timeText: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    statLabel: {
      fontSize: 8,
      fontWeight: '500',
      color: colors.textSecondary,
      marginTop: 1,
    },
  });
