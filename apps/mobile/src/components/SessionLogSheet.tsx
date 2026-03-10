import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../theme';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

interface SessionLogSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

const EMOJI_RATINGS = [
  { emoji: '\u{1F614}', label: 'Ruim', value: 1 },
  { emoji: '\u{1F610}', label: 'Ok', value: 2 },
  { emoji: '\u{1F60A}', label: 'Bom', value: 3 },
  { emoji: '\u{1F929}', label: '\u00D3timo', value: 4 },
] as const;

export function SessionLogSheet({ isVisible, onClose }: SessionLogSheetProps) {
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleSave = () => {
    // TODO: Save session to API
    setSelectedDuration(null);
    setSelectedRating(null);
    onClose();
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h${m}` : `${h}h`;
    }
    return `${minutes}min`;
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['60%']}
    >
      <Text style={styles.title} maxFontSizeMultiplier={1.2}>
        Registrar sess\u00E3o
      </Text>

      {/* Duration Selection */}
      <Text style={styles.sectionLabel}>Dura\u00E7\u00E3o</Text>
      <View style={styles.chipRow}>
        {DURATION_OPTIONS.map((duration) => (
          <Pressable
            key={duration}
            style={[
              styles.durationChip,
              selectedDuration === duration && styles.durationChipSelected,
            ]}
            onPress={() => setSelectedDuration(duration)}
            accessibilityRole="button"
            accessibilityLabel={`${formatDuration(duration)} de estudo`}
            accessibilityState={{ selected: selectedDuration === duration }}
          >
            <Text
              style={[
                styles.durationChipText,
                selectedDuration === duration && styles.durationChipTextSelected,
              ]}
              maxFontSizeMultiplier={1.2}
            >
              {formatDuration(duration)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Emoji Rating */}
      <Text style={styles.sectionLabel}>Como foi a sess\u00E3o?</Text>
      <View style={styles.emojiRow}>
        {EMOJI_RATINGS.map((rating) => (
          <Pressable
            key={rating.value}
            style={[
              styles.emojiButton,
              selectedRating === rating.value && styles.emojiButtonSelected,
            ]}
            onPress={() => setSelectedRating(rating.value)}
            accessibilityRole="button"
            accessibilityLabel={rating.label}
            accessibilityState={{ selected: selectedRating === rating.value }}
          >
            <Text style={styles.emoji}>{rating.emoji}</Text>
            <Text
              style={[
                styles.emojiLabel,
                selectedRating === rating.value && styles.emojiLabelSelected,
              ]}
            >
              {rating.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <Button
          label="Salvar"
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationChip: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipSelected: {
    backgroundColor: colors.accent,
  },
  durationChipText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  durationChipTextSelected: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  emojiButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  emojiButtonSelected: {
    backgroundColor: colors.surface,
  },
  emoji: {
    fontSize: typography.sizes.xl + 10,
  },
  emojiLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  emojiLabelSelected: {
    color: colors.text,
  },
  saveContainer: {
    marginTop: spacing.sm,
  },
  saveButton: {
    width: '100%',
  },
});
