import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '../theme';
import { BottomSheet } from '../components';
import { logStudySession, ScheduleBlockData } from '../services/api';

interface SessionLogSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSessionLogged: () => void;
  block: ScheduleBlockData;
}

const RATINGS = [
  { value: 1, emoji: '\u{1F629}', label: 'Dificil' },
  { value: 2, emoji: '\u{1F610}', label: 'Ok' },
  { value: 3, emoji: '\u{1F60A}', label: 'Facil' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function SessionLogSheet({
  isVisible,
  onClose,
  onSessionLogged,
  block,
}: SessionLogSheetProps) {
  const [duration, setDuration] = useState(block.duration_minutes);
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = rating !== null && duration > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    try {
      await logStudySession({
        schedule_block_id: block.id,
        disciplina_id: block.disciplina_id,
        topic: block.topic,
        duration_minutes: duration,
        self_rating: rating!,
        notes: notes.trim() || undefined,
        started_at: new Date().toISOString(),
      });
      onSessionLogged();
    } catch (error) {
      console.error('Error logging session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['70%']}
    >
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Registrar sessao</Text>
        <Text style={styles.subtitle}>
          {block.disciplina_name} - {block.topic}
        </Text>

        {/* Duration Picker */}
        <Text style={styles.sectionLabel}>Duracao (minutos)</Text>
        <View style={styles.durationRow}>
          {DURATION_OPTIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDuration(d)}
              style={[
                styles.durationChip,
                duration === d && styles.durationChipActive,
              ]}
            >
              <Text
                style={[
                  styles.durationText,
                  duration === d && styles.durationTextActive,
                ]}
              >
                {d}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Self Rating */}
        <Text style={styles.sectionLabel}>Como foi?</Text>
        <View style={styles.ratingRow}>
          {RATINGS.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRating(r.value)}
              style={[
                styles.ratingOption,
                rating === r.value && styles.ratingOptionActive,
              ]}
            >
              <Text style={styles.ratingEmoji}>{r.emoji}</Text>
              <Text
                style={[
                  styles.ratingLabel,
                  rating === r.value && styles.ratingLabelActive,
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notes */}
        <Text style={styles.sectionLabel}>Anotacoes (opcional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Algo que queira lembrar..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
          style={{ opacity: canSubmit && !loading ? 1 : 0.5 }}
        >
          <LinearGradient
            colors={[colors.accent, colors.accentPink]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButton}
          >
            <Text style={styles.submitText}>
              {loading ? 'Registrando...' : 'Registrar sessao'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: -spacing.sm,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surface,
    minWidth: 52,
    alignItems: 'center',
  },
  durationChipActive: {
    backgroundColor: colors.accent,
  },
  durationText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  durationTextActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ratingOption: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  ratingOptionActive: {
    backgroundColor: colors.accent + '30',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  ratingEmoji: {
    fontSize: 28,
  },
  ratingLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  ratingLabelActive: {
    color: colors.accent,
    fontWeight: typography.weights.bold,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.sizes.sm,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
