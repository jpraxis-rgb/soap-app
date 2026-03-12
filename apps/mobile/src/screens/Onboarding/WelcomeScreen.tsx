import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components';

const { width, height: screenHeight } = Dimensions.get('window');

// ── Vaporwave palette ────────────────────────────────────────
const vapor = {
  cyan: '#00E5FF',
  pink: '#FF6B9D',
  lavender: '#C490FF',
  hotPink: '#FF2D95',
  teal: '#00D4AA',
  peach: '#FFB8D0',
};

// ── Floating Orb ──────────────────────────────────────────────
function FloatingOrb({
  size,
  color,
  initialX,
  initialY,
  driftX,
  driftY,
  duration,
}: {
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  driftX: number;
  driftY: number;
  duration: number;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animateAxis = (anim: Animated.Value, drift: number, dur: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: drift,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: -drift,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: dur * 0.6,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };
    animateAxis(translateX, driftX, duration);
    animateAxis(translateY, driftY, duration * 1.3);

    // Dreamy pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOpacity, {
          toValue: 0.5,
          duration: duration * 0.8,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseOpacity, {
          toValue: 1,
          duration: duration * 0.8,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orb,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: initialX,
          top: initialY,
          transform: [{ translateX }, { translateY }],
          opacity: pulseOpacity,
        },
      ]}
    />
  );
}

// ── Glass Surface ────────────────────────────────────────────
function GlassSurface({
  children,
  style,
  intensity = 40,
  borderColor = vapor.lavender + '20',
}: {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  borderColor?: string;
}) {
  return (
    <View style={[styles.glassOuter, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={styles.glassBlur}
      >
        <View style={[styles.glassInner, { borderColor }]}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

// ── Slide data ────────────────────────────────────────────────
interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  gradientColors: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  stepLabel: string;
}

const slides: SlideData[] = [
  {
    id: '1',
    title: 'Do edital ao\ncronograma em minutos',
    subtitle: 'Importe seu edital e receba um plano de estudos personalizado, priorizando o que mais cai na prova.',
    gradientColors: [vapor.lavender, vapor.cyan],
    icon: 'book-outline',
    accentColor: vapor.lavender,
    stepLabel: '01',
  },
  {
    id: '2',
    title: 'Cronograma\nPersonalizado',
    subtitle: 'Plano de estudos adaptado ao seu tempo, com foco nas disciplinas de maior peso.',
    gradientColors: [vapor.hotPink, vapor.peach],
    icon: 'calendar-outline',
    accentColor: vapor.pink,
    stepLabel: '02',
  },
  {
    id: '3',
    title: 'Conteúdo\nSob Medida',
    subtitle: 'Resumos, flashcards, quizzes e mapas mentais gerados para cada tópico do seu edital.',
    gradientColors: [vapor.cyan, vapor.teal],
    icon: 'library-outline',
    accentColor: vapor.cyan,
    stepLabel: '03',
  },
];

// ── Main component ────────────────────────────────────────────
interface WelcomeScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Breathing glow animation
  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 1.35,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.2,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0.5,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      navigation.navigate('SignUp');
    }
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      {/* Icon with layered vaporwave glow */}
      <View style={styles.iconArea}>
        {/* Outer glow — wide, dreamy */}
        <Animated.View
          style={[
            styles.iconGlowOuter,
            {
              backgroundColor: item.gradientColors[1],
              transform: [{ scale: glowScale }],
              opacity: glowOpacity,
            },
          ]}
        />
        {/* Inner glow — tight, saturated */}
        <Animated.View
          style={[
            styles.iconGlow,
            {
              backgroundColor: item.gradientColors[0],
              transform: [{ scale: Animated.multiply(glowScale, 0.85) }],
              opacity: Animated.add(glowOpacity, 0.15),
            },
          ]}
        />
        <LinearGradient
          colors={item.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <Ionicons name={item.icon} size={52} color="#FFFFFF" />
        </LinearGradient>
      </View>

      {/* Glass card wrapping text content */}
      <GlassSurface
        style={styles.slideGlass}
        intensity={30}
        borderColor={item.accentColor + '25'}
      >
        {/* Step label */}
        <View style={[styles.stepBadge, { backgroundColor: item.accentColor + '18' }]}>
          <Text style={[styles.stepText, { color: item.accentColor }]}>{item.stepLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </GlassSurface>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Floating orbs — vaporwave ambient */}
      <FloatingOrb
        size={240}
        color={vapor.lavender + '22'}
        initialX={-80}
        initialY={screenHeight * 0.08}
        driftX={50}
        driftY={35}
        duration={6000}
      />
      <FloatingOrb
        size={180}
        color={vapor.hotPink + '1A'}
        initialX={width - 60}
        initialY={screenHeight * 0.22}
        driftX={-40}
        driftY={30}
        duration={7500}
      />
      <FloatingOrb
        size={200}
        color={vapor.cyan + '18'}
        initialX={width * 0.2}
        initialY={screenHeight * 0.55}
        driftX={35}
        driftY={-25}
        duration={8000}
      />
      <FloatingOrb
        size={160}
        color={vapor.peach + '15'}
        initialX={-30}
        initialY={screenHeight * 0.72}
        driftX={55}
        driftY={22}
        duration={9000}
      />
      <FloatingOrb
        size={120}
        color={vapor.teal + '12'}
        initialX={width * 0.6}
        initialY={screenHeight * 0.85}
        driftX={-30}
        driftY={-18}
        duration={7000}
      />

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
      />

      {/* Bottom area — frosted glass */}
      <GlassSurface style={styles.bottomArea} intensity={50} borderColor={vapor.lavender + '15'}>
        {/* Animated pagination dots */}
        <View style={styles.paginationRow}>
          <View style={styles.pagination}>
            {slides.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [6, 24, 6],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View key={index} style={{ opacity: dotOpacity }}>
                  <Animated.View style={{ overflow: 'hidden', borderRadius: 3, width: dotWidth, height: 6 }}>
                    <LinearGradient
                      colors={[vapor.lavender, vapor.pink]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>

          {/* Next button */}
          <Button
            label={activeIndex === slides.length - 1 ? 'Começar' : 'Próximo'}
            onPress={handleNext}
            icon={<Ionicons name="arrow-forward" size={18} color={colors.text} />}
          />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>Sistema Operacional do Aprovado</Text>

        {/* Sign in link */}
        <Button
          label="Já tenho conta"
          onPress={() => navigation.navigate('SignIn')}
          variant="outlined"
          style={styles.signInButton}
        />
      </GlassSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orb: {
    position: 'absolute',
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  slideGlass: {
    marginTop: spacing.lg,
    width: '100%',
  },
  iconArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  iconGlowOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Glass surface styles
  glassOuter: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  glassBlur: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  glassInner: {
    borderWidth: 1,
    borderRadius: 20,
    padding: spacing.lg,
    backgroundColor: 'rgba(26, 26, 46, 0.4)',
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 100,
    marginBottom: spacing.md,
    alignSelf: 'center',
  },
  stepText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.sm,
  },
  bottomArea: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    color: vapor.lavender,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  signInButton: {
    marginTop: 0,
  },
});
