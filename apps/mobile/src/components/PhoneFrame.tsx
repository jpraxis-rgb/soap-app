import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform, type ViewStyle } from 'react-native';
import { useTheme, type ThemeColors } from '../theme';

interface PhoneFrameProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PhoneFrame({ children, style }: PhoneFrameProps) {
  const { colors } = useTheme();
  const [screenWidth, setScreenWidth] = useState(() => Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => sub.remove();
  }, []);

  const frameWidth = Math.min(screenWidth * 0.38, 170);
  const frameHeight = frameWidth * 1.9;
  const styles = createStyles(colors, frameWidth, frameHeight);

  return (
    <View style={[styles.frame, style]}>
      {/* Notch indicator */}
      <View style={styles.notch} />
      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, frameWidth: number, frameHeight: number) =>
  StyleSheet.create({
    frame: {
      width: frameWidth,
      height: frameHeight,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      padding: 4,
      alignItems: 'center',
      overflow: 'hidden',
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
      width: 30,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 3,
    },
    content: {
      flex: 1,
      width: '100%',
    },
  });
