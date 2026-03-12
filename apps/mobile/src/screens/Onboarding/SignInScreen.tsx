import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

interface SignInScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

export function SignInScreen({ navigation }: SignInScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email ou senha incorretos.';
      Alert.alert('Erro', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>
            Bem-vindo de volta! Continue seus estudos.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <Button
            label="Entrar"
            onPress={handleSignIn}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />

          <Pressable
            onPress={() => navigation.navigate('SignUp')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Não tem conta?{' '}
              <Text style={styles.linkHighlight}>Criar conta</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  linkHighlight: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
});
