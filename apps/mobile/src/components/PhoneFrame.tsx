import React from 'react';
import { View, StyleSheet, Dimensions, Platform, type ViewStyle } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhoneFrameProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PhoneFrame({ children, style }: PhoneFrameProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.frame, style]}>
      {/* Notch indicator */}
      <View style={styles.notch} />
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const FRAME_WIDTH = SCREEN_WIDTH * 0.48;
const FRAME_HEIGHT = FRAME_WIDTH * 2;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    frame: {
      width: FRAME_WIDTH,
      height: FRAME_HEIGHT,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 10,
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    notch: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 6,
    },
    content: {
      flex: 1,
      width: '100%',
    },
  });
