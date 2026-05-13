import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { MOCK_FLASHCARDS } from '../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FlashcardData {
  front: string;
  back: string;
  hint?: string;
}

export function FlashcardScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const item = route.params?.item || MOCK_FLASHCARDS[0];
  const cards: FlashcardData[] = (item.body as any)?.cards || [];

  const styles = createStyles(colors);

  const RATING_BUTTONS = [
    { key: 'again', label: 'Errei', color: colors.error, icon: 'close-circle' as const },
    { key: 'hard', label: 'Difícil', color: colors.warning, icon: 'alert-circle' as const },
    { key: 'good', label: 'Bom', color: colors.success, icon: 'checkmark-circle' as const },
    { key: 'easy', label: 'Fácil', color: colors.accent, icon: 'star' as const },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const flipProgress = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flipProgress.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const handleFlip = useCallback(() => {
    if (isFlipped) return;
    setIsFlipped(true);
    setShowRating(true);
    flipProgress.value = withTiming(1, {
      duration: reduceMotion ? 0 : 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [isFlipped, flipProgress, reduceMotion]);

  const handleRate = useCallback(
    (rating: string) => {
      if (rating === 'good' || rating === 'easy') {
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      // Move to next card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        setCompleted(true);
        return;
      }

      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      setShowRating(false);
      flipProgress.value = 0;
    },
    [currentIndex, cards.length, flipProgress]
  );

  if (cards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhum flashcard disponível</Text>
        </View>
      </View>
    );
  }

  if (completed) {
    return (
      <View style={styles.container}>
        <View style={styles.completedContainer}>
          <Ionicons name="trophy" size={64} color={colors.success} />
          <Text style={styles.completedTitle}>Parabéns!</Text>
          <Text style={styles.completedSubtext}>
            Você revisou todos os {cards.length} flashcards
          </Text>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={20} color={colors.warning} />
              <Text style={styles.streakText}>Sequência de {streak} acertos</Text>
            </View>
          )}
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={[styles.backButtonGradient, { backgroundColor: colors.accent }]}>
              <Text style={[styles.backButtonText, { color: colors.accentForeground }]}>Concluir</Text>
            </View>
          </Pressable>
        </View>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressFill,
              { width: `${((currentIndex) / cards.length) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {cards.length}
          </Text>
          {streak > 0 && (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={16} color={colors.warning} />
              <Text style={styles.streakSmallText}>{streak}</Text>
            </View>
          )}
        </View>
      </View>

      {item?.professorName && (
        <View style={styles.professorRow}>
          <Ionicons name="person-circle" size={16} color={colors.accent} />
          <Text style={styles.professorText}>Revisado por {item.professorName}</Text>
        </View>
      )}

      {/* Card */}
      <View style={styles.cardContainer}>
        <Pressable onPress={handleFlip} style={styles.cardPressable}>
          {/* Front */}
          <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
            <Text style={styles.cardLabel}>PERGUNTA</Text>
            <Text style={styles.cardText}>{currentCard.front}</Text>
            {currentCard.hint && !isFlipped && (
              <View style={styles.hintContainer}>
                <Ionicons name="bulb-outline" size={16} color={colors.warning} />
                <Text style={styles.hintText}>{currentCard.hint}</Text>
              </View>
            )}
            {!isFlipped && (
              <Text style={styles.tapHint}>Toque para virar</Text>
            )}
          </Animated.View>

          {/* Back */}
          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <Text style={styles.cardLabel}>RESPOSTA</Text>
            <Text style={styles.cardText}>{currentCard.back}</Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Rating buttons */}
      {showRating && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Como foi?</Text>
          <View style={styles.ratingButtons}>
            {RATING_BUTTONS.map((btn) => (
              <Pressable
                key={btn.key}
                style={[styles.ratingButton, { borderColor: btn.color }]}
                onPress={() => handleRate(btn.key)}
              >
                <Ionicons name={btn.icon} size={24} color={btn.color} />
                <Text style={[styles.ratingButtonText, { color: btn.color }]}>
                  {btn.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  progressBackground: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakSmallText: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  professorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  professorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  cardPressable: {
    width: SCREEN_WIDTH - spacing.md * 2,
    height: 300,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  cardBack: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  cardLabel: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: 1,
  },
  cardText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    lineHeight: typography.sizes.lg * typography.lineHeights.relaxed,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  hintText: {
    color: colors.warning,
    fontSize: typography.sizes.xs,
  },
  tapHint: {
    position: 'absolute',
    bottom: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  ratingContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  ratingTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.card,
  },
  ratingButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
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
  completedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  completedTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
  },
  completedSubtext: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginTop: spacing.sm,
  },
  streakText: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  backButton: {
    marginTop: spacing.lg,
    width: '80%',
  },
  backButtonGradient: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
