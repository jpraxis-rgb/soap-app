import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { BottomSheet } from '../components';
import { logStudySession, ScheduleBlockData } from '../services/api';

interface SessionLogSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSessionLogged: () => void;
  block: ScheduleBlockData;
}

const RATINGS = [
  { value: 1, emoji: '\u{1F629}', label: 'Difícil' },
  { value: 2, emoji: '\u{1F610}', label: 'Ok' },
  { value: 3, emoji: '\u{1F60A}', label: 'Fácil' },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

export function SessionLogSheet({
  isVisible,
  onClose,
  onSessionLogged,
  block,
}: SessionLogSheetProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível registrar a sessão. Tente novamente.');
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
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <Text style={styles.title}>Registrar sessão</Text>
        <Text style={styles.subtitle}>
          {block.disciplina_name} - {block.topic}
        </Text>

        {/* Duration Picker */}
        <Text style={styles.sectionLabel}>Duração (minutos)</Text>
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
        <Text style={styles.sectionLabel}>Anotações (opcional)</Text>
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
          <View style={[styles.submitButton, { backgroundColor: colors.accent }]}>
            <Text style={[styles.submitText, { color: colors.accentForeground }]}>
              {loading ? 'Registrando...' : 'Registrar sessão'}
            </Text>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
