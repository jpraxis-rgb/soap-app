import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card, Button } from '../components';
import { MOCK_QUIZZES } from '../services/api';

interface Alternative {
  label: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  alternatives: Alternative[];
  correctAnswer: string;
  explanation: string;
}

interface QuizBody {
  questions: Question[];
}

type QuestionResult = 'correct' | 'incorrect' | 'unanswered';

export function QuizScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const item = route.params?.item || MOCK_QUIZZES[0];
  const questions: Question[] = ((item.body as QuizBody)?.questions) || [];

  const styles = createStyles(colors);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>(
    questions.map(() => 'unanswered')
  );
  const [showResults, setShowResults] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const currentQuestion = questions[currentIndex];
  const score = results.filter((r) => r === 'correct').length;

  const handleSelectAnswer = useCallback(
    (label: string) => {
      if (hasAnswered) return;
      setSelectedAnswer(label);
    },
    [hasAnswered]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedAnswer || hasAnswered) return;

    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const newResults = [...results];
    newResults[currentIndex] = isCorrect ? 'correct' : 'incorrect';
    setResults(newResults);
    setHasAnswered(true);
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: selectedAnswer }));
  }, [selectedAnswer, hasAnswered, currentQuestion, currentIndex, results]);

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setShowResults(true);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setSelectedAnswer(null);
    setHasAnswered(false);
  }, [currentIndex, questions.length]);

  const handleReviewErrors = useCallback(() => {
    const errorIndices = results
      .map((r, i) => (r === 'incorrect' ? i : -1))
      .filter((i) => i >= 0);
    if (errorIndices.length > 0) {
      setReviewMode(true);
      setReviewIndex(0);
    }
  }, [results]);

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma questão disponível</Text>
        </View>
      </View>
    );
  }

  // Review errors mode
  if (reviewMode) {
    const errorIndices = results
      .map((r, i) => (r === 'incorrect' ? i : -1))
      .filter((i) => i >= 0);
    const qi = errorIndices[reviewIndex];
    const q = questions[qi];
    const userAnswer = userAnswers[q.id];

    return (
      <View style={styles.container}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>Revisão de erros</Text>
          <Text style={styles.reviewCount}>
            {reviewIndex + 1} / {errorIndices.length}
          </Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Card style={styles.questionCard}>
            <Text style={styles.questionText}>{q.question}</Text>
          </Card>

          {q.alternatives.map((alt) => {
            const isCorrect = alt.label === q.correctAnswer;
            const isUserAnswer = alt.label === userAnswer;
            let borderColor = colors.surface;
            if (isCorrect) borderColor = colors.success;
            if (isUserAnswer && !isCorrect) borderColor = colors.error;

            return (
              <View
                key={alt.label}
                style={[styles.alternative, { borderColor }]}
              >
                <View style={styles.altLabelContainer}>
                  <Text
                    style={[
                      styles.altLabel,
                      isCorrect && { color: colors.success },
                      isUserAnswer && !isCorrect && { color: colors.error },
                    ]}
                  >
                    {alt.label}
                  </Text>
                </View>
                <Text style={styles.altText}>{alt.text}</Text>
                {isCorrect && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
                {isUserAnswer && !isCorrect && (
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                )}
              </View>
            );
          })}

          <Card style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={20} color={colors.accent} />
              <Text style={styles.explanationTitle}>Explicação</Text>
            </View>
            <Text style={styles.explanationText}>{q.explanation}</Text>
          </Card>
        </ScrollView>

        <View style={styles.bottomAction}>
          {reviewIndex < errorIndices.length - 1 ? (
            <Button
              label="Próxima"
              onPress={() => setReviewIndex(reviewIndex + 1)}
            />
          ) : (
            <Button label="Voltar" onPress={() => navigation.goBack()} />
          )}
        </View>
      </View>
    );
  }

  // Results screen
  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    const errorsCount = results.filter((r) => r === 'incorrect').length;

    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scoreCircle}>
            <Text style={styles.scorePercentage}>{percentage}%</Text>
            <Text style={styles.scoreLabel}>
              {score} / {questions.length}
            </Text>
          </View>

          <Text style={styles.resultsTitle}>
            {percentage >= 80
              ? 'Excelente!'
              : percentage >= 60
              ? 'Bom trabalho!'
              : 'Continue estudando!'}
          </Text>

          {/* Question result summary */}
          <View style={styles.resultsSummary}>
            {results.map((result, index) => (
              <View key={index} style={styles.resultDot}>
                <View
                  style={[
                    styles.resultDotInner,
                    {
                      backgroundColor:
                        result === 'correct' ? colors.success : colors.error,
                    },
                  ]}
                />
                <Text style={styles.resultDotLabel}>Q{index + 1}</Text>
              </View>
            ))}
          </View>

          <View style={styles.resultsActions}>
            {errorsCount > 0 && (
              <Button
                label={`Revisar erros (${errorsCount})`}
                onPress={handleReviewErrors}
                variant="outlined"
              />
            )}
            <Button label="Voltar" onPress={() => navigation.goBack()} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main quiz flow
  return (
    <View style={styles.container}>
      {/* Segmented progress bar */}
      <View style={styles.segmentedProgress}>
        {results.map((result, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor:
                  result === 'correct'
                    ? colors.success
                    : result === 'incorrect'
                    ? colors.error
                    : index === currentIndex
                    ? colors.accent
                    : colors.surface,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Card style={styles.questionCard}>
          <Text style={styles.questionNumber}>Questão {currentIndex + 1}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </Card>

        {/* Alternatives */}
        {currentQuestion.alternatives.map((alt) => {
          const isSelected = selectedAnswer === alt.label;
          const isCorrect =
            hasAnswered && alt.label === currentQuestion.correctAnswer;
          const isWrong =
            hasAnswered && isSelected && alt.label !== currentQuestion.correctAnswer;

          let borderColor = colors.surface;
          let bgColor = colors.card;

          if (hasAnswered) {
            if (isCorrect) {
              borderColor = colors.success;
              bgColor = colors.success + '15';
            } else if (isWrong) {
              borderColor = colors.error;
              bgColor = colors.error + '15';
            }
          } else if (isSelected) {
            borderColor = colors.accent;
            bgColor = colors.accent + '10';
          }

          return (
            <Pressable
              key={alt.label}
              onPress={() => handleSelectAnswer(alt.label)}
              style={[
                styles.alternative,
                { borderColor, backgroundColor: bgColor },
              ]}
            >
              <View
                style={[
                  styles.altLabelContainer,
                  isSelected && !hasAnswered && { backgroundColor: colors.accent },
                  isCorrect && { backgroundColor: colors.success },
                  isWrong && { backgroundColor: colors.error },
                ]}
              >
                <Text
                  style={[
                    styles.altLabel,
                    (isSelected || isCorrect || isWrong) && { color: colors.text },
                  ]}
                >
                  {alt.label}
                </Text>
              </View>
              <Text style={styles.altText}>{alt.text}</Text>
              {isCorrect && (
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              )}
              {isWrong && (
                <Ionicons name="close-circle" size={20} color={colors.error} />
              )}
            </Pressable>
          );
        })}

        {/* Explanation (shown after answering) */}
        {hasAnswered && (
          <Card style={styles.explanationCard}>
            <View style={styles.explanationHeader}>
              <Ionicons name="information-circle" size={20} color={colors.accent} />
              <Text style={styles.explanationTitle}>Explicação</Text>
            </View>
            <Text style={styles.explanationText}>
              {currentQuestion.explanation}
            </Text>
          </Card>
        )}

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>

      {/* Bottom action */}
      <View style={styles.bottomAction}>
        {!hasAnswered ? (
          <Button
            label="Confirmar"
            onPress={handleConfirm}
            variant={selectedAnswer ? 'filled' : 'outlined'}
          />
        ) : (
          <Button
            label={
              currentIndex + 1 >= questions.length
                ? 'Ver resultado'
                : 'Próxima'
            }
            onPress={handleNext}
          />
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  segmentedProgress: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  questionCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  questionNumber: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  questionText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  alternative: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  altLabelContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  altLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  altText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  explanationCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  explanationTitle: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  explanationText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  bottomAction: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
  },
  // Results screen
  resultsContent: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scorePercentage: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  resultsTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.lg,
  },
  resultsSummary: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  resultDot: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultDotInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  resultDotLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  resultsActions: {
    width: '100%',
    gap: spacing.sm,
  },
  // Review mode
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  reviewTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  reviewCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
});
