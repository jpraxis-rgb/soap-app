import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../theme';
import { parseEdital } from '../services/api';
import type { ParsedEditalData } from '../contexts/ConcursoContext';

export function EditalImportScreen() {
  const navigation = useNavigation<any>();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      Alert.alert('URL obrigatoria', 'Cole a URL do edital para continuar.');
      return;
    }

    setLoading(true);
    try {
      const edital = await parseEdital(url.trim()) as ParsedEditalData;
      navigation.navigate('EditalReview', { edital });
    } catch (err: any) {
      Alert.alert('Erro ao analisar', err?.message || 'Nao foi possivel analisar o edital. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPDF = () => {
    Alert.alert(
      'Em breve',
      'O upload de PDF estar\u00e1 dispon\u00edvel em uma pr\u00f3xima atualiza\u00e7\u00e3o.',
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerArea}>
          <Ionicons name="document-text-outline" size={48} color={colors.accent} />
          <Text style={styles.title}>Importar Edital</Text>
          <Text style={styles.subtitle}>
            Adicione um concurso ao seu plano de estudos
          </Text>
        </View>

        {/* URL Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>URL do Edital</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="link-outline"
              size={20}
              color={colors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Cole a URL do edital aqui"
              placeholderTextColor={colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!loading}
            />
          </View>
        </View>

        {/* Analyze Button */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Analisando edital com IA...</Text>
          </View>
        ) : (
          <Pressable onPress={handleAnalyze} style={styles.buttonWrapper}>
            <LinearGradient
              colors={[colors.accent, colors.accentPink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="search-outline" size={20} color={colors.text} />
              <Text style={styles.buttonText}>Analisar</Text>
            </LinearGradient>
          </Pressable>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Upload PDF Button */}
        <Pressable onPress={handleUploadPDF} style={styles.outlinedButton}>
          <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          <Text style={styles.outlinedButtonText}>Fazer upload do PDF</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerArea: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  inputLabel: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.md,
    paddingVertical: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  buttonWrapper: {
    marginTop: spacing.lg,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surface,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  outlinedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  outlinedButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
