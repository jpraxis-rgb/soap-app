import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedStyle,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Simbolo } from './Logo';

const BRAND_VIOLET = '#6D28D9';
const TUDO_ORANGE = '#FDBA74';

interface AnimatedSplashProps {
  onComplete: () => void;
}

export function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation shared values
  const badgeOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.9);
  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) {
        // Show final frame instantly
        badgeOpacity.value = 1;
        badgeScale.value = 1;
        wordmarkOpacity.value = 1;
        taglineOpacity.value = 1;
        onComplete();
      }
    });
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    // Fallback timeout in case reanimated callback doesn't fire
    const fallback = setTimeout(onComplete, 2200);

    // 0.0–0.4s: badge with the mark fades in + scales
    badgeOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    badgeScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // 0.3–0.7s: wordmark fades in
    wordmarkOpacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));

    // 0.8–1.1s: tagline fades in
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));

    // 1.8–2.0s: entire view fades out
    containerOpacity.value = withDelay(1800, withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }, () => {
      runOnJS(onComplete)();
    }));

    return () => clearTimeout(fallback);
  }, [reduceMotion]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const wordmarkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const taglineAnimatedStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <View style={styles.content}>
        <Animated.View style={[styles.badge, badgeAnimatedStyle]}>
          <Simbolo size={72} />
        </Animated.View>

        <Animated.Text
          style={[styles.wordmark, wordmarkAnimatedStyle]}
          accessibilityRole="header"
          accessibilityLabel="Estuda Tudo"
        >
          estuda<Animated.Text style={styles.wordmarkTudo}>tudo</Animated.Text>
        </Animated.Text>

        <Animated.Text style={[styles.tagline, taglineAnimatedStyle]}>
          Todo o edital. Um plano.
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  wordmark: {
    fontFamily: 'Archivo_800ExtraBold',
    color: '#FFFFFF',
    fontSize: 36,
    letterSpacing: -0.5,
  },
  wordmarkTudo: {
    fontFamily: 'Archivo_800ExtraBold',
    color: TUDO_ORANGE,
    fontSize: 36,
    letterSpacing: -0.5,
  },
  tagline: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
});
