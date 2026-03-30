import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, spacing, typography, borderRadius, type ThemeColors } from '../theme';
import { Card } from '../components';
import { useConcurso } from '../contexts/ConcursoContext';
import {
  logStudySession,
  updateStudySession,
  deleteStudySession,
  StudySessionData,
} from '../services/api';

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120] as const;

const RATING_OPTIONS = [
  { icon: 'thunderstorm-outline' as const, label: 'Difícil', value: 1, selectedColor: '#FF6B6B' },
  { icon: 'partly-sunny-outline' as const, label: 'Ok', value: 2, selectedColor: '#FFB347' },
  { icon: 'sunny-outline' as const, label: 'Fácil', value: 3, selectedColor: '#4ECB71' },
] as const;

interface RouteParams {
  session?: StudySessionData;
  disciplinaId?: string;
  disciplinaName?: string;
}

export function ManualSessionScreen() {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params: RouteParams = route.params || {};
  const { activeConcurso } = useConcurso();

  const isEdit = !!params.session;
  const session = params.session;

  const disciplinas = activeConcurso?.edital?.disciplinas ?? [];

  // State
  const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string | null>(
    session?.disciplina_id ?? params.disciplinaId ?? null,
  );
  const [showDisciplinaPicker, setShowDisciplinaPicker] = useState(false);
  // Determine if the session's topic matches a known discipline topic
  const initialTopicIsCustom = useMemo(() => {
    if (!session?.topic) return false;
    const discTopics = disciplinas.find((d: any) => d.id === (session.disciplina_id ?? params.disciplinaId))?.topics ?? [];
    return !discTopics.includes(session.topic);
  }, []);

  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopicIsCustom ? '' : (session?.topic ?? ''),
  );
  const [customTopic, setCustomTopic] = useState(initialTopicIsCustom ? (session?.topic ?? '') : '');
  const [useCustomTopic, setUseCustomTopic] = useState(initialTopicIsCustom);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(
    session?.duration_minutes ?? null,
  );
  const [customDuration, setCustomDuration] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>(
    session?.started_at ? new Date(session.started_at) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selfRating, setSelfRating] = useState<number | null>(session?.self_rating ?? null);
  const [notes, setNotes] = useState(session?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const selectedDisciplina = useMemo(
    () => disciplinas.find((d: any) => d.id === selectedDisciplinaId),
    [disciplinas, selectedDisciplinaId],
  );

  const selectedDisciplinaName = useMemo(() => {
    if (selectedDisciplina?.name) return selectedDisciplina.name;
    if (params.disciplinaName) return params.disciplinaName;
    return 'Selecionar disciplina';
  }, [selectedDisciplina, params.disciplinaName]);

  const topics: string[] = selectedDisciplina?.topics ?? [];

  const effectiveTopic = useCustomTopic ? customTopic : selectedTopic;
  const effectiveDuration = durationMinutes ?? (customDuration ? parseInt(customDuration, 10) : 0);

  const canSubmit =
    selectedDisciplinaId &&
    effectiveTopic.trim() &&
    effectiveDuration > 0 &&
    selfRating != null;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit && session) {
        await updateStudySession(session.id, {
          topic: effectiveTopic.trim(),
          duration_minutes: effectiveDuration,
          self_rating: selfRating!,
          notes: notes.trim() || undefined,
          started_at: sessionDate.toISOString(),
        });
      } else {
        await logStudySession({
          disciplina_id: selectedDisciplinaId!,
          topic: effectiveTopic.trim(),
          duration_minutes: effectiveDuration,
          self_rating: selfRating!,
          notes: notes.trim() || undefined,
          started_at: sessionDate.toISOString(),
        });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível salvar a sessão.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!session) return;
    Alert.alert('Excluir sessão', 'Tem certeza que deseja excluir esta sessão de estudo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          setSubmitting(true);
          try {
            await deleteStudySession(session.id);
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível excluir a sessão.');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h${m}` : `${h}h`;
    }
    return `${minutes}min`;
  };

  const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = sessionDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Discipline Picker */}
      <Text style={styles.sectionLabel}>Disciplina</Text>
      {isEdit ? (
        <View style={styles.readOnlyField}>
          <Ionicons name="book-outline" size={18} color={colors.accent} />
          <Text style={styles.readOnlyText}>{selectedDisciplinaName}</Text>
        </View>
      ) : (
        <>
          <Pressable
            style={styles.pickerButton}
            onPress={() => setShowDisciplinaPicker(!showDisciplinaPicker)}
            accessibilityLabel="Selecionar disciplina"
            accessibilityRole="button"
          >
            <Ionicons name="book-outline" size={18} color={colors.accent} />
            <Text
              style={[
                styles.pickerButtonText,
                !selectedDisciplinaId && { color: colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {selectedDisciplinaName}
            </Text>
            <Ionicons
              name={showDisciplinaPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          {showDisciplinaPicker && (
            <View style={styles.dropdown}>
              {disciplinas.map((d: any) => (
                <Pressable
                  key={d.id}
                  style={[
                    styles.dropdownItem,
                    d.id === selectedDisciplinaId && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedDisciplinaId(d.id);
                    setSelectedTopic('');
                    setUseCustomTopic(false);
                    setShowDisciplinaPicker(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{d.name}</Text>
                  {d.id === selectedDisciplinaId && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {/* Topic Picker */}
      {selectedDisciplinaId && (
        <>
          <Text style={styles.sectionLabel}>Tópico</Text>
          <View style={styles.chipRow}>
            {topics.map((topic) => (
              <Pressable
                key={topic}
                style={[
                  styles.chip,
                  selectedTopic === topic && !useCustomTopic && styles.chipSelected,
                ]}
                onPress={() => {
                  setSelectedTopic(topic);
                  setUseCustomTopic(false);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedTopic === topic && !useCustomTopic && styles.chipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {topic}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.chip, useCustomTopic && styles.chipSelected]}
              onPress={() => setUseCustomTopic(true)}
            >
              <Text style={[styles.chipText, useCustomTopic && styles.chipTextSelected]}>
                Outro
              </Text>
            </Pressable>
          </View>
          {useCustomTopic && (
            <TextInput
              style={styles.textInput}
              placeholder="Nome do tópico"
              placeholderTextColor={colors.textSecondary}
              value={customTopic}
              onChangeText={setCustomTopic}
            />
          )}
        </>
      )}

      {/* Duration */}
      <Text style={styles.sectionLabel}>Duração</Text>
      <View style={styles.chipRow}>
        {DURATION_PRESETS.map((d) => (
          <Pressable
            key={d}
            style={[styles.chip, durationMinutes === d && styles.chipSelected]}
            onPress={() => {
              setDurationMinutes(d);
              setCustomDuration('');
            }}
          >
            <Text style={[styles.chipText, durationMinutes === d && styles.chipTextSelected]}>
              {formatDuration(d)}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.textInput}
        placeholder="Ou digite minutos"
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={customDuration}
        onChangeText={(text) => {
          setCustomDuration(text);
          setDurationMinutes(null);
        }}
      />

      {/* Date/Time */}
      <Text style={styles.sectionLabel}>Data e hora</Text>
      <View style={styles.dateRow}>
        <Pressable style={styles.dateButton} onPress={() => setShowDatePicker(true)} accessibilityLabel="Selecionar data" accessibilityRole="button">
          <Ionicons name="calendar-outline" size={18} color={colors.accent} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </Pressable>
        <Pressable style={styles.dateButton} onPress={() => setShowTimePicker(true)} accessibilityLabel="Selecionar horário" accessibilityRole="button">
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.dateText}>{formattedTime}</Text>
        </Pressable>
      </View>
      {showDatePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={sessionDate}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_, date) => {
              if (Platform.OS !== 'ios') setShowDatePicker(false);
              if (date) {
                const updated = new Date(sessionDate);
                updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setSessionDate(updated);
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDoneButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.pickerDoneText}>Confirmar</Text>
            </Pressable>
          )}
        </View>
      )}
      {showTimePicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={sessionDate}
            mode="time"
            display="spinner"
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_, date) => {
              if (Platform.OS !== 'ios') setShowTimePicker(false);
              if (date) {
                const updated = new Date(sessionDate);
                updated.setHours(date.getHours(), date.getMinutes());
                setSessionDate(updated);
              }
            }}
          />
          {Platform.OS === 'ios' && (
            <Pressable style={styles.pickerDoneButton} onPress={() => setShowTimePicker(false)}>
              <Text style={styles.pickerDoneText}>Confirmar</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Rating */}
      <Text style={styles.sectionLabel}>Como foi?</Text>
      <View style={styles.ratingRow}>
        {RATING_OPTIONS.map((r) => {
          const isSelected = selfRating === r.value;
          return (
            <Pressable
              key={r.value}
              style={[
                styles.ratingCard,
                isSelected && { backgroundColor: r.selectedColor + '20', borderColor: r.selectedColor },
              ]}
              onPress={() => setSelfRating(r.value)}
            >
              <Ionicons
                name={r.icon}
                size={28}
                color={isSelected ? r.selectedColor : colors.textSecondary}
              />
              <Text
                style={[
                  styles.ratingLabel,
                  isSelected && { color: r.selectedColor, fontWeight: typography.weights.bold },
                ]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Notes */}
      <Text style={styles.sectionLabel}>Anotações (opcional)</Text>
      <TextInput
        style={[styles.textInput, styles.notesInput]}
        placeholder="Ex: Revisei jurisprudência do STF..."
        placeholderTextColor={colors.textSecondary}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
      />

      {/* Validation hints */}
      {!canSubmit && (
        <View style={styles.hintContainer}>
          {!selectedDisciplinaId && (
            <Text style={styles.hintText}>Selecione uma disciplina</Text>
          )}
          {selectedDisciplinaId && !effectiveTopic.trim() && (
            <Text style={styles.hintText}>Selecione ou digite um tópico</Text>
          )}
          {effectiveDuration <= 0 && (
            <Text style={styles.hintText}>Informe a duração</Text>
          )}
          {selfRating == null && (
            <Text style={styles.hintText}>Avalie como foi a sessão</Text>
          )}
        </View>
      )}

      {/* Submit */}
      <Pressable
        style={[styles.submitWrapper, !canSubmit && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        <View style={[styles.submitButton, { backgroundColor: colors.accent }]}>
          {submitting ? (
            <ActivityIndicator color={colors.accentForeground} />
          ) : (
            <Text style={[styles.submitText, { color: colors.accentForeground }]}>
              {isEdit ? 'Salvar alterações' : 'Registrar sessão'}
            </Text>
          )}
        </View>
      </Pressable>

      {/* Delete (edit mode only) */}
      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete} disabled={submitting}>
          <Text style={styles.deleteText}>Excluir sessão</Text>
        </Pressable>
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    readOnlyField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    readOnlyText: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    pickerButtonText: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.medium,
    },
    dropdown: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      marginTop: spacing.xs,
      overflow: 'hidden',
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    dropdownItemActive: {
      backgroundColor: colors.surface,
    },
    dropdownItemText: {
      color: colors.text,
      fontSize: typography.sizes.sm,
      flex: 1,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.accent,
    },
    chipText: {
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
    chipTextSelected: {
      fontWeight: typography.weights.bold,
    },
    textInput: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      color: colors.text,
      fontSize: typography.sizes.sm,
      marginTop: spacing.sm,
    },
    notesInput: {
      minHeight: 80,
    },
    dateRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dateButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
    },
    dateText: {
      color: colors.text,
      fontSize: typography.sizes.sm,
    },
    ratingRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    ratingCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: spacing.xs,
    },
    ratingLabel: {
      color: colors.textSecondary,
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
    },
    pickerContainer: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    pickerDoneButton: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.surface,
    },
    pickerDoneText: {
      color: colors.accent,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    hintContainer: {
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    hintText: {
      color: colors.warning,
      fontSize: typography.sizes.xs,
    },
    submitWrapper: {
      marginTop: spacing.lg,
    },
    submitButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: borderRadius.md,
    },
    submitText: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    deleteButton: {
      alignItems: 'center',
      marginTop: spacing.md,
      paddingVertical: spacing.md,
    },
    deleteText: {
      color: colors.error,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
    },
  });
