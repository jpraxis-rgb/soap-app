import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme, spacing, typography, type ThemeColors } from '../theme';
import { Card } from '../components';
import { API_ORIGIN, MOCK_MIND_MAPS } from '../services/api';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Section {
  heading: string;
  content: string;
  keyPoints: string[];
}

interface KeyTerm {
  term: string;
  definition: string;
}

interface Source {
  title: string;
  author?: string;
  type: string;
}

interface SummaryBody {
  sections: Section[];
  keyTerms: KeyTerm[];
  sources?: Source[];
}

interface MindMapBranch {
  label: string;
  color: string;
  children: { label: string }[];
}

interface MindMapBody {
  centralNode: string;
  branches: MindMapBranch[];
  imageUrls?: string[];
}

function resolveAssetUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Inline markdown renderer: handles **bold** and *italic*. Nested <Text> inherits
// the outer text style, so callers pass their usual style to the wrapper.
function MarkdownText({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const parts: React.ReactNode[] = [];
  const re = /\*\*([^*\n]+)\*\*|(?<![\*\w])\*([^*\n]+)\*(?!\w)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(children)) !== null) {
    if (m.index > last) parts.push(children.slice(last, m.index));
    if (m[1] !== undefined) {
      parts.push(
        <Text key={key++} style={{ fontWeight: typography.weights.bold }}>
          {m[1]}
        </Text>,
      );
    } else if (m[2] !== undefined) {
      parts.push(
        <Text key={key++} style={{ fontStyle: 'italic' }}>
          {m[2]}
        </Text>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <Text style={style}>{parts}</Text>;
}

export function ContentScreen() {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const item = route.params?.item;
  const mode = route.params?.mode;

  const styles = createStyles(colors);

  if (mode === 'mindmap') {
    return <MindMapView item={item} />;
  }

  const body = item?.body as SummaryBody | undefined;
  const sections = body?.sections || [];
  const keyTerms = body?.keyTerms || [];
  const sources = body?.sources || [];

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = contentSize.height > layoutMeasurement.height
      ? contentOffset.y / (contentSize.height - layoutMeasurement.height)
      : 0;
    setScrollProgress(Math.min(1, Math.max(0, progress)));
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${scrollProgress * 100}%` }]}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.title}>{item?.title || 'Conteúdo'}</Text>

        {item?.professorName && (
          <View style={styles.authorRow}>
            <Ionicons name="person-circle" size={20} color={colors.accent} />
            <Text style={styles.authorText}>
              Revisado por {item.professorName}
            </Text>
          </View>
        )}

        {/* Empty state */}
        {sections.length === 0 && keyTerms.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Conteúdo ainda não disponível</Text>
          </View>
        )}

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <MarkdownText style={styles.sectionContent}>{section.content}</MarkdownText>

            {section.keyPoints.length > 0 && (
              <Card style={styles.calloutBox}>
                <View style={styles.calloutHeader}>
                  <Ionicons name="bulb" size={18} color={colors.warning} />
                  <Text style={styles.calloutTitle}>Pontos-chave</Text>
                </View>
                {section.keyPoints.map((point, pIndex) => (
                  <View key={pIndex} style={styles.keyPointRow}>
                    <View style={styles.bullet} />
                    <MarkdownText style={styles.keyPointText}>{point}</MarkdownText>
                  </View>
                ))}
              </Card>
            )}
          </View>
        ))}

        {/* Key terms */}
        {keyTerms.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Termos-chave</Text>
            {keyTerms.map((term, index) => (
              <Card key={index} style={styles.termCard}>
                <Text style={styles.termName}>{term.term}</Text>
                <MarkdownText style={styles.termDefinition}>{term.definition}</MarkdownText>
              </Card>
            ))}
          </View>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sourcesHeader}>
              <Ionicons name="library-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.sourcesTitle}>Fontes</Text>
            </View>
            {sources.map((source, index) => (
              <View key={index} style={styles.sourceRow}>
                <Text style={styles.sourceIndex}>{index + 1}.</Text>
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceTitle}>{source.title}</Text>
                  {source.author && (
                    <Text style={styles.sourceAuthor}>{source.author}</Text>
                  )}
                  <Text style={styles.sourceType}>{source.type}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Continue studying */}
        <View style={styles.continueSection}>
          <Text style={styles.continueSectionTitle}>Continuar estudando</Text>
          <View style={styles.continueRow}>
            <Pressable
              style={styles.continueButton}
              onPress={() => navigation.navigate('Flashcard', { item: route.params?.item })}
            >
              <Ionicons name="layers" size={24} color={colors.accent} />
              <Text style={styles.continueButtonText}>Flashcards</Text>
            </Pressable>
            <Pressable
              style={styles.continueButton}
              onPress={() => navigation.navigate('Quiz', { item: route.params?.item })}
            >
              <Ionicons name="help-circle" size={24} color={colors.accentSecondary} />
              <Text style={styles.continueButtonText}>Quiz</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

function ZoomableImage({ uri }: { uri: string }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value === 1) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
      savedScale.value = 1;
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        overflow: 'hidden',
        backgroundColor: colors.background,
      }}
    >
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
          <Image
            source={{ uri }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function MindMapImageView({ item, body }: { item: any; body: MindMapBody }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const urls = (body.imageUrls ?? []).map(resolveAssetUrl);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        pagingEnabled={urls.length > 1}
      >
        {urls.map((uri, i) => (
          <ZoomableImage key={i} uri={uri} />
        ))}
      </ScrollView>

      {item?.professorName && (
        <View
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: colors.card,
            paddingHorizontal: spacing.sm,
            paddingVertical: 4,
            borderRadius: 12,
            opacity: 0.9,
          }}
        >
          <Ionicons name="person-circle" size={14} color={colors.accent} />
          <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs }}>
            {item.professorName}
          </Text>
        </View>
      )}
    </View>
  );
}

function MindMapView({ item }: { item: any }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const body = (item?.body || MOCK_MIND_MAPS[0].body) as MindMapBody;

  if (body.imageUrls && body.imageUrls.length > 0) {
    return <MindMapImageView item={item} body={body} />;
  }

  const centerX = SCREEN_WIDTH / 2;
  const centerY = 200;
  const branchRadius = 140;
  const childRadius = 80;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{item?.title || 'Mapa Mental'}</Text>

        {item?.professorName && (
          <View style={styles.authorRow}>
            <Ionicons name="person-circle" size={20} color={colors.accent} />
            <Text style={styles.authorText}>
              Revisado por {item.professorName}
            </Text>
          </View>
        )}

        <View style={styles.svgContainer}>
          <Svg width={SCREEN_WIDTH - spacing.md * 2} height={500} viewBox={`0 0 ${SCREEN_WIDTH - spacing.md * 2} 500`}>
            {/* Branch lines and nodes */}
            {body.branches.map((branch, bIndex) => {
              const angle = (bIndex / body.branches.length) * Math.PI * 2 - Math.PI / 2;
              const bx = centerX + Math.cos(angle) * branchRadius;
              const by = centerY + Math.sin(angle) * branchRadius;

              return (
                <React.Fragment key={bIndex}>
                  {/* Line from center to branch */}
                  <Line
                    x1={centerX}
                    y1={centerY}
                    x2={bx}
                    y2={by}
                    stroke={branch.color}
                    strokeWidth={2}
                    opacity={0.6}
                  />
                  {/* Branch circle */}
                  <Circle cx={bx} cy={by} r={35} fill={branch.color} opacity={0.2} />
                  <Circle cx={bx} cy={by} r={35} stroke={branch.color} strokeWidth={2} fill="none" />
                  <SvgText
                    x={bx}
                    y={by}
                    textAnchor="middle"
                    alignmentBaseline="central"
                    fill={colors.text}
                    fontSize={9}
                    fontWeight="600"
                  >
                    {branch.label}
                  </SvgText>

                  {/* Children */}
                  {branch.children.map((child, cIndex) => {
                    const childAngle =
                      angle +
                      ((cIndex - (branch.children.length - 1) / 2) * 0.4);
                    const cx2 = bx + Math.cos(childAngle) * childRadius;
                    const cy2 = by + Math.sin(childAngle) * childRadius;

                    return (
                      <React.Fragment key={cIndex}>
                        <Line
                          x1={bx}
                          y1={by}
                          x2={cx2}
                          y2={cy2}
                          stroke={branch.color}
                          strokeWidth={1}
                          opacity={0.4}
                        />
                        <Circle cx={cx2} cy={cy2} r={25} fill={colors.surface} />
                        <Circle cx={cx2} cy={cy2} r={25} stroke={branch.color} strokeWidth={1.5} fill="none" />
                        <SvgText
                          x={cx2}
                          y={cy2}
                          textAnchor="middle"
                          alignmentBaseline="central"
                          fill={colors.text}
                          fontSize={8}
                        >
                          {child.label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}

            {/* Central node */}
            <Circle cx={centerX} cy={centerY} r={50} fill={colors.accent} opacity={0.3} />
            <Circle cx={centerX} cy={centerY} r={50} stroke={colors.accent} strokeWidth={3} fill="none" />
            <SvgText
              x={centerX}
              y={centerY}
              textAnchor="middle"
              alignmentBaseline="central"
              fill={colors.text}
              fontSize={10}
              fontWeight="700"
            >
              {body.centralNode}
            </SvgText>
          </Svg>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          {body.branches.map((branch, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: branch.color }]} />
              <Text style={styles.legendText}>{branch.label}</Text>
              <Text style={styles.legendChildCount}>
                {branch.children.length} itens
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: colors.surface,
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  authorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    color: colors.accent,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    color: colors.text,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  calloutBox: {
    backgroundColor: colors.surface,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  calloutTitle: {
    color: colors.warning,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  keyPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 7,
  },
  keyPointText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    flex: 1,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  termCard: {
    marginBottom: spacing.sm,
  },
  termName: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  termDefinition: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  sourcesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  sourcesTitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sourceIndex: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 1,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  sourceAuthor: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontStyle: 'italic',
  },
  sourceType: {
    color: colors.accent,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  continueSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  continueSectionTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  continueRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  continueButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  continueButtonText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  svgContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  legendContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    flex: 1,
  },
  legendChildCount: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
});
