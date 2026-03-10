import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors } from '../theme';

interface GradientTextProps {
  text: string;
  style?: TextStyle;
}

export function GradientText({ text, style }: GradientTextProps) {
  // Simplified version using accent color text as fallback
  // For full gradient text, use MaskedView with expo-linear-gradient
  return <Text style={[{ color: colors.accent }, style]}>{text}</Text>;
}
