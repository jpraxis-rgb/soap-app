import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { Card, Badge } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { useConcurso } from '../contexts/ConcursoContext';
import { showAlert, showConfirm } from '../utils/alert';

const TIER_LABELS: Record<string, string> = {
  free: 'Gratuito',
  registro: 'Básico',
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
  navigation: { navigate: (screen: string, params?: any) => void };
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, subscriptionTier } = useAuth();
  const { concursos, activeConcurso, setActiveConcurso, removeConcurso } = useConcurso();
  const [notifications, setNotifications] = useState({
    studyReminder: true,
    weeklySummary: true,
    newContent: false,
    quietHours: false,
  });

  const handleLogout = () => {
    showConfirm('Sair', 'Tem certeza que deseja sair?', () => logout(), 'Sair');
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
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
            <Badge text={tierLabel} color={tierColor} />
          </View>
        </View>
      </Card>

      {/* Concursos Card */}
      <Card header={`Meus Concursos (${concursos.length})`} style={styles.section}>
        {concursos.length === 0 ? (
          <View style={styles.concursoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.concursoName}>Nenhum concurso</Text>
              <Text style={styles.concursoDetail}>Importe um edital para começar</Text>
            </View>
            <Pressable
              style={styles.changeButton}
              onPress={() => navigation.navigate('EditalImport')}
            >
              <Text style={styles.changeButtonText}>Importar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {concursos.map(c => (
              <View key={c.id} style={[styles.concursoRow, { borderBottomWidth: 1, borderBottomColor: colors.surface, paddingVertical: spacing.sm }]}>
                <Pressable style={{ flex: 1 }} onPress={() => setActiveConcurso(c.id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons
                      name={c.id === activeConcurso?.id ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={c.id === activeConcurso?.id ? colors.accent : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.concursoName} numberOfLines={1}>{c.edital?.orgao || (c as any).parsedData?.orgao || 'Concurso'}</Text>
                      <Text style={styles.concursoDetail} numberOfLines={1}>{c.edital?.cargo || (c as any).parsedData?.cargo || c.edital?.banca || ''}</Text>
                    </View>
                  </View>
                </Pressable>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => {
                    showConfirm(
                      'Remover concurso',
                      `Remover ${c.edital?.orgao || (c as any).parsedData?.orgao || 'este concurso'}?`,
                      () => removeConcurso(c.id),
                      'Remover',
                    );
                  }}
                  style={styles.trashButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <Pressable
              style={[styles.changeButton, { marginTop: spacing.sm, alignSelf: 'flex-start' }]}
              onPress={() => navigation.navigate('EditalImport')}
            >
              <Text style={styles.changeButtonText}>+ Adicionar concurso</Text>
            </Pressable>
          </>
        )}
      </Card>

      {/* Notification Toggles */}
      <Card header="Notificações" style={styles.section}>
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
          label="Novo conteúdo"
          value={notifications.newContent}
          onToggle={(v) => setNotifications(prev => ({ ...prev, newContent: v }))}
        />
        <ToggleRow
          label="Horário silencioso"
          value={notifications.quietHours}
          onToggle={(v) => setNotifications(prev => ({ ...prev, quietHours: v }))}
        />
      </Card>

      {/* Subscription Card */}
      <Card header="Assinatura" style={styles.section}>
        <View style={styles.subscriptionInfo}>
          <Text style={styles.planText}>Plano atual: {tierLabel}</Text>
          {subscriptionTier !== 'free' && (
            <Text style={styles.billingText}>Renovação: em breve</Text>
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
          onPress={() => showAlert('Termos', 'Em breve')}
        />
        <MenuRow
          label="Política de privacidade"
          onPress={() => showAlert('Privacidade', 'Em breve')}
        />
        <MenuRow
          label="Ajuda e suporte"
          onPress={() => showAlert('Ajuda', 'Em breve')}
        />
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </View>
      </Card>

      {/* Settings & Logout */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={20} color={colors.text} />
          <Text style={styles.settingsText}>Configurações</Text>
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
  trashButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
