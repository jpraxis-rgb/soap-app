import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../theme';
import { Card } from '../components';
import { useAuth } from '../contexts/AuthContext';

export function SettingsScreen() {
  const { logout } = useAuth();

  const [notifications, setNotifications] = useState({
    studyReminder: true,
    weeklySummary: true,
    newContent: false,
    quietHours: false,
  });

  const [preferences, setPreferences] = useState({
    darkTheme: true,
    autoPlay: false,
    downloadOverWifi: true,
  });

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir conta',
      'Tem certeza? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Info', 'Funcionalidade em breve');
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notification Preferences */}
      <Card header="Notificações" style={styles.section}>
        <ToggleRow
          icon="notifications-outline"
          label="Lembrete de estudo"
          subtitle="Receba lembretes diários"
          value={notifications.studyReminder}
          onToggle={(v) => setNotifications(prev => ({ ...prev, studyReminder: v }))}
        />
        <ToggleRow
          icon="calendar-outline"
          label="Resumo semanal"
          subtitle="Relatório de progresso"
          value={notifications.weeklySummary}
          onToggle={(v) => setNotifications(prev => ({ ...prev, weeklySummary: v }))}
        />
        <ToggleRow
          icon="document-text-outline"
          label="Novo conteúdo"
          subtitle="Quando novo material estiver disponível"
          value={notifications.newContent}
          onToggle={(v) => setNotifications(prev => ({ ...prev, newContent: v }))}
        />
        <ToggleRow
          icon="moon-outline"
          label="Horário silencioso"
          subtitle="Sem notificações entre 22h e 7h"
          value={notifications.quietHours}
          onToggle={(v) => setNotifications(prev => ({ ...prev, quietHours: v }))}
        />
      </Card>

      {/* App Preferences */}
      <Card header="Preferências" style={styles.section}>
        <ToggleRow
          icon="moon"
          label="Tema escuro"
          subtitle="Sempre ativado (em breve mais opções)"
          value={preferences.darkTheme}
          onToggle={(v) => setPreferences(prev => ({ ...prev, darkTheme: v }))}
        />
        <ToggleRow
          icon="play-circle-outline"
          label="Reprodução automática"
          subtitle="Iniciar vídeos automaticamente"
          value={preferences.autoPlay}
          onToggle={(v) => setPreferences(prev => ({ ...prev, autoPlay: v }))}
        />
        <ToggleRow
          icon="wifi-outline"
          label="Download via Wi-Fi"
          subtitle="Baixar conteúdo apenas no Wi-Fi"
          value={preferences.downloadOverWifi}
          onToggle={(v) => setPreferences(prev => ({ ...prev, downloadOverWifi: v }))}
        />
      </Card>

      {/* Account Management */}
      <Card header="Conta" style={styles.section}>
        <Pressable
          style={styles.menuRow}
          onPress={() => Alert.alert('Info', 'Funcionalidade em breve')}
        >
          <Ionicons name="key-outline" size={20} color={colors.text} />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Alterar senha</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={styles.menuRow}
          onPress={() => Alert.alert('Info', 'Funcionalidade em breve')}
        >
          <Ionicons name="download-outline" size={20} color={colors.text} />
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>Exportar dados</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>

        <Pressable
          style={[styles.menuRow, { borderBottomWidth: 0 }]}
          onPress={handleDeleteAccount}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
          <View style={styles.menuContent}>
            <Text style={[styles.menuLabel, { color: colors.error }]}>Excluir conta</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.error} />
        </Pressable>
      </Card>

      {/* Logout */}
      <Pressable
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert('Sair', 'Tem certeza?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Sair', style: 'destructive', onPress: () => logout() },
          ]);
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Sair da conta</Text>
      </Pressable>
    </ScrollView>
  );
}

function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surface, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
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
  section: {
    marginBottom: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  toggleSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    gap: spacing.sm,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    fontWeight: typography.weights.semibold,
  },
});
