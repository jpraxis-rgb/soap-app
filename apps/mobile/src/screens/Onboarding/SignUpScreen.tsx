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
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography, type ThemeColors } from '../../theme';
import { Button } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpScreenProps {
  navigation: { navigate: (screen: string) => void; goBack: () => void };
}

export function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focused, setFocused] = useState<Record<string, boolean>>({});

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const errors = {
    name: touched.name && !name.trim() ? 'Nome é obrigatório' : '',
    email: touched.email && !email.trim()
      ? 'Email é obrigatório'
      : touched.email && !isValidEmail(email.trim())
        ? 'Email inválido'
        : '',
    password: touched.password && !password.trim()
      ? 'Senha é obrigatória'
      : touched.password && password.length < 6
        ? 'Mínimo 6 caracteres'
        : '',
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleFocus = (field: string) => setFocused(prev => ({ ...prev, [field]: true }));

  const handleGoogleSignIn = () => {
    Alert.alert('Em breve', 'Login com Google disponível em breve.');
  };

  const handleSignUp = async () => {
    setTouched({ name: true, email: true, password: true });

    if (!name.trim() || !email.trim() || !password.trim()) {
      return;
    }

    if (!isValidEmail(email.trim()) || password.length < 6) {
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta.';
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
      {/* Accent gradient bar */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBar}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          {/* Branded header icon */}
          <View style={styles.headerIcon}>
            <Ionicons name="person-add-outline" size={24} color={colors.accent} />
          </View>
          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>
            Comece sua jornada de estudos agora
          </Text>
        </View>

        {/* Google Sign-In button */}
        <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
          <Ionicons name="logo-google" size={20} color="#1A1A2E" />
          <Text style={styles.googleButtonText}>Continuar com Google</Text>
        </Pressable>

        {/* "ou" divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Como quer ser chamado?</Text>
            <TextInput
              style={[styles.input, focused.name && styles.inputFocused, !!errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              onFocus={() => handleFocus('name')}
              onBlur={() => handleBlur('name')}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              autoComplete="name"
            />
            {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Seu melhor e-mail</Text>
            <TextInput
              style={[styles.input, focused.email && styles.inputFocused, !!errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              onFocus={() => handleFocus('email')}
              onBlur={() => handleBlur('email')}
              placeholder="seu@email.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {!!errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crie uma senha</Text>
            <TextInput
              style={[styles.input, focused.password && styles.inputFocused, !!errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry
              autoComplete="password-new"
            />
            {!!errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <Button
            label="Criar conta"
            onPress={handleSignUp}
            loading={loading}
            style={{ marginTop: spacing.md }}
          />

          <Pressable
            onPress={() => navigation.navigate('SignIn')}
            style={styles.link}
          >
            <Text style={styles.linkText}>
              Já tem conta?{' '}
              <Text style={styles.linkHighlight}>Entrar</Text>
            </Text>
          </Pressable>

          {/* Terms text */}
          <Text style={styles.termsText}>
            Ao continuar, você concorda com nossos{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Alert.alert('Termos', 'Link dos Termos de Uso em breve.')}
            >
              Termos
            </Text>
            {' '}e{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Alert.alert('Privacidade', 'Link da Política de Privacidade em breve.')}
            >
              Política de Privacidade
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientBar: {
    height: 3,
    width: '100%',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
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
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginHorizontal: spacing.md,
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
    borderColor: colors.border,
  },
  inputFocused: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  linkText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  linkHighlight: {
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
  termsText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingBottom: spacing.xl,
  },
  termsLink: {
    color: colors.accent,
  },
});
