import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { Card, Badge } from '../components';
import { useAuth } from '../contexts/AuthContext';

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuito',
  registro: 'Registro',
  microlearning: 'Microlearning',
  mentor: 'Mentor',
};

const TIER_COLORS: Record<string, string> = {
  free: colors.textSecondary,
  registro: colors.success,
  microlearning: colors.accent,
  mentor: colors.accentPink,
};

interface ProfileScreenProps {
  navigation: { navigate: (screen: string) => void };
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, subscriptionTier } = useAuth();
  const [notifications, setNotifications] = useState({
    studyReminder: true,
    weeklySummary: true,
    newContent: false,
    quietHours: false,
  });

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  };

  const tierLabel = TIER_LABELS[subscriptionTier] || 'Gratuito';
  const tierColor = TIER_COLORS[subscriptionTier] || colors.textSecondary;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '??';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: tierColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Badge text={tierLabel} color={tierColor} />
          </View>
        </View>
      </Card>

      {/* Active Concurso Card */}
      <Card header="Concurso Ativo" style={styles.section}>
        <View style={styles.concursoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.concursoName}>Nenhum selecionado</Text>
            <Text style={styles.concursoDetail}>Selecione um concurso para comecar</Text>
          </View>
          <Pressable
            style={styles.changeButton}
            onPress={() => Alert.alert('Trocar', 'Funcionalidade em breve')}
          >
            <Text style={styles.changeButtonText}>Trocar</Text>
          </Pressable>
        </View>
      </Card>

      {/* Notification Toggles */}
      <Card header="Notificacoes" style={styles.section}>
        <ToggleRow
          label="Lembrete de estudo"
          value={notifications.studyReminder}
          onToggle={(v) => setNotifications(prev => ({ ...prev, studyReminder: v }))}
        />
        <ToggleRow
          label="Resumo semanal"
          value={notifications.weeklySummary}
          onToggle={(v) => setNotifications(prev => ({ ...prev, weeklySummary: v }))}
        />
        <ToggleRow
          label="Novo conteudo"
          value={notifications.newContent}
          onToggle={(v) => setNotifications(prev => ({ ...prev, newContent: v }))}
        />
        <ToggleRow
          label="Horario silencioso"
          value={notifications.quietHours}
          onToggle={(v) => setNotifications(prev => ({ ...prev, quietHours: v }))}
        />
      </Card>

      {/* Subscription Card */}
      <Card header="Assinatura" style={styles.section}>
        <View style={styles.subscriptionInfo}>
          <Text style={styles.planText}>Plano atual: {tierLabel}</Text>
          {subscriptionTier !== 'free' && (
            <Text style={styles.billingText}>Renovacao: em breve</Text>
          )}
        </View>
        <Pressable
          style={styles.manageButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.manageButtonText}>Gerenciar assinatura</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </Pressable>
      </Card>

      {/* About Section */}
      <Card header="Sobre" style={styles.section}>
        <MenuRow
          label="Termos de uso"
          onPress={() => Alert.alert('Termos', 'Em breve')}
        />
        <MenuRow
          label="Politica de privacidade"
          onPress={() => Alert.alert('Privacidade', 'Em breve')}
        />
        <MenuRow
          label="Ajuda e suporte"
          onPress={() => Alert.alert('Ajuda', 'Em breve')}
        />
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Versao 1.0.0</Text>
        </View>
      </Card>

      {/* Settings & Logout */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={styles.settingsText}>Configuracoes</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.menuRow} onPress={onPress}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    marginBottom: spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.md,
  },
  concursoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  concursoName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  concursoDetail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  changeButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  changeButtonText: {
    color: colors.accent,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  subscriptionInfo: {
    marginBottom: spacing.sm,
  },
  planText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  billingText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  manageButtonText: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  menuLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  versionRow: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  versionText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  bottomActions: {
    marginTop: spacing.sm,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  settingsText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.medium,
  },
});
