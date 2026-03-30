import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  useAnimatedStyle,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, type ThemeColors } from '../theme';

const UNDERLINE_MAX_WIDTH = 90;

interface AnimatedSplashProps {
  onComplete: () => void;
}

export function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Animation shared values
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.96);
  const underlineProgress = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
      if (enabled) {
        // Show final frame instantly
        titleOpacity.value = 1;
        titleScale.value = 1;
        underlineProgress.value = 1;
        taglineOpacity.value = 1;
        onComplete();
      }
    });
  }, []);

  useEffect(() => {
    if (reduceMotion) return;

    // Fallback timeout in case reanimated callback doesn't fire
    const fallback = setTimeout(onComplete, 2200);

    // 0.0–0.4s: "SOAP" fades in + scales
    titleOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    titleScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

    // 0.2–0.7s: Gradient underline animates width (pixel-based)
    underlineProgress.value = withDelay(200, withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }));

    // 0.8–1.1s: Tagline fades in
    taglineOpacity.value = withDelay(800, withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }));

    // 1.8–2.0s: Entire view fades out (extended from 1.3s for longer visibility)
    containerOpacity.value = withDelay(1800, withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }, () => {
      runOnJS(onComplete)();
    }));

    return () => clearTimeout(fallback);
  }, [reduceMotion]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const underlineAnimatedStyle = useAnimatedStyle(() => ({
    width: interpolate(underlineProgress.value, [0, 1], [0, UNDERLINE_MAX_WIDTH]),
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
        <Animated.Text
          style={[styles.title, titleAnimatedStyle]}
          accessibilityRole="header"
        >
          SOAP
        </Animated.Text>

        <View style={styles.underlineContainer}>
          <Animated.View style={[styles.underlineWrapper, underlineAnimatedStyle]}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.underline}
            />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.tagline, taglineAnimatedStyle]}>
          Sistema Operacional do Aprovado
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
    },
    title: {
      color: '#FFFFFF',
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 3,
    },
    underlineContainer: {
      width: UNDERLINE_MAX_WIDTH,
      height: 3,
      marginTop: 8,
      marginBottom: 16,
    },
    underlineWrapper: {
      height: 3,
      overflow: 'hidden',
    },
    underline: {
      flex: 1,
    },
    tagline: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '500',
    },
  });
