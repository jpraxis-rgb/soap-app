import React from 'react';
import {
  Modal,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme, spacing, borderRadius, ThemeColors } from '../theme';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: string[];
}

export function BottomSheet({
  isVisible,
  onClose,
  children,
  snapPoints = ['50%'],
}: BottomSheetProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const height = snapPoints[0] || '50%';

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View />
      </Pressable>
      <View style={[styles.sheet, { height: height as any }]}>
        <View style={styles.indicator} />
        <ScrollView style={styles.content}>{children}</ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: borderRadius.lg,
      borderTopRightRadius: borderRadius.lg,
      paddingTop: spacing.sm,
    },
    indicator: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.textSecondary,
      alignSelf: 'center',
      marginBottom: spacing.sm,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
  });
