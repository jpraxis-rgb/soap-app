import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  ViewToken,
  Pressable,
  AccessibilityInfo,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, spacing, typography, type ThemeColors } from '../../theme';
import { useAuth } from '../../contexts/AuthContext';
import { Button, PhoneFrame } from '../../components';
import { EditalMockup } from './mockups/EditalMockup';
import { HomeMockup } from './mockups/HomeMockup';
import { FlashcardMockup } from './mockups/FlashcardMockup';

// ── Slide data ────────────────────────────────────────────────
interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  MockupComponent: React.ComponentType;
}

const slides: SlideData[] = [
  {
    id: '1',
    title: 'Do edital ao\ncronograma em minutos',
    subtitle: 'Importe seu edital e receba um plano de estudos personalizado, priorizando o que mais cai na prova.',
    MockupComponent: EditalMockup,
  },
  {
    id: '2',
    title: 'Cronograma\nPersonalizado',
    subtitle: 'Plano de estudos adaptado ao seu tempo, com foco nas disciplinas de maior peso.',
    MockupComponent: HomeMockup,
  },
  {
    id: '3',
    title: 'Conteúdo\nSob Medida',
    subtitle: 'Resumos, flashcards, quizzes e mapas mentais gerados para cada tópico do seu edital.',
    MockupComponent: FlashcardMockup,
  },
];

// ── Main component ────────────────────────────────────────────
interface WelcomeScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const { colors } = useTheme();
  const { googleAuth } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [width, setWidth] = useState(() => Dimensions.get('window').width);
  const [bottomHeight, setBottomHeight] = useState(300);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const styles = createStyles(colors, width);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await googleAuth();
    } catch (error: any) {
      if (Platform.OS !== 'web') {
        const { statusCodes } = await import('../../services/googleAuth');
        if (error?.code === statusCodes.SIGN_IN_CANCELLED) return;
      }
      const message = error instanceof Error ? error.message : 'Erro ao entrar com Google.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Erro', message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const opacity = reduceMotion
      ? 1
      : scrollX.interpolate({
          inputRange,
          outputRange: [0.4, 1, 0.4],
          extrapolate: 'clamp',
        });

    const translateY = reduceMotion
      ? 0
      : scrollX.interpolate({
          inputRange,
          outputRange: [20, 0, 20],
          extrapolate: 'clamp',
        });

    const { MockupComponent } = item;

    return (
      <View style={[styles.slide, { paddingBottom: bottomHeight }]}>
        <Animated.View style={[styles.slideContent, { opacity, transform: [{ translateY }] }]}>
          {/* Phone frame mockup */}
          <PhoneFrame>
            <MockupComponent />
          </PhoneFrame>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{item.subtitle}</Text>

        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <Pressable
        style={[styles.skipButton, { top: insets.top + 12 }]}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.skipText}>Pular</Text>
      </Pressable>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={Platform.OS !== 'web'}
        snapToInterval={Platform.OS === 'web' ? width : undefined}
        snapToAlignment={Platform.OS === 'web' ? 'start' : undefined}
        decelerationRate={Platform.OS === 'web' ? 'fast' : undefined}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom area — positioned over the FlatList so slides get full height */}
      <View
        style={styles.bottomArea}
        pointerEvents="box-none"
        onLayout={(e) => setBottomHeight(e.nativeEvent.layout.height + 8)}
      >
      <View style={styles.bottomCard}>
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
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View key={index} style={{ opacity: dotOpacity }}>
                  <Animated.View style={{ overflow: 'hidden', borderRadius: 4, width: dotWidth, height: 8 }}>
                    <LinearGradient
                      colors={[colors.gradientStart, colors.gradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1 }}
                    />
                  </Animated.View>
                </Animated.View>
              );
            })}
          </View>
        </View>

        {/* CTA button — always visible */}
        <Button
          label="Criar conta"
          onPress={() => navigation.navigate('SignUp')}
          variant="filled"
        />

        {/* Google sign in */}
        <Pressable
          style={[styles.googleButton, googleLoading && { opacity: 0.6 }]}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <Ionicons name="logo-google" size={20} color="#1A1A2E" />
          <Text style={styles.googleButtonText}>
            {googleLoading ? 'Conectando...' : 'Continuar com Google'}
          </Text>
        </Pressable>

        {/* Sign in link */}
        <Button
          label="Já tenho conta"
          onPress={() => navigation.navigate('SignIn')}
          variant="outlined"
          style={styles.signInButton}
        />
      </View>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, width: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipButton: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 270, // overridden dynamically
  },
  slideContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  bottomCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 14,
    gap: 10,
    marginTop: spacing.sm,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  signInButton: {
    marginTop: spacing.sm,
  },
});
