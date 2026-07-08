import { Alert, Platform } from 'react-native';

// Cross-platform alert helpers.
//
// react-native-web does NOT implement Alert.alert (it is a silent no-op), so any
// user feedback or confirmation routed through Alert.alert simply never appears on
// the web build. These helpers fall back to window.alert / window.confirm on web
// while preserving React Native's button semantics (cancel vs confirm/destructive
// and their onPress callbacks), and delegate to Alert.alert on native.

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

function composeMessage(title: string, message?: string): string {
  return message ? `${title}\n\n${message}` : title;
}

/**
 * Show an informational alert. On web this uses window.alert and then invokes the
 * first non-cancel button's onPress (or the single button's onPress) so callbacks
 * still run. On native it delegates to Alert.alert.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  if (typeof window !== 'undefined' && typeof window.alert === 'function') {
    window.alert(composeMessage(title, message));
  }

  if (buttons && buttons.length > 0) {
    const actionButton = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
    actionButton?.onPress?.();
  }
}

/**
 * Show a confirmation dialog. On web this uses window.confirm and routes the result
 * to the confirm button (style !== 'cancel') or the cancel button (style === 'cancel')
 * onPress callbacks. On native it delegates to Alert.alert with the given buttons.
 */
export function showConfirm(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const cancelButton = buttons?.find((b) => b.style === 'cancel');
  const confirmButton = buttons?.find((b) => b.style !== 'cancel');

  const confirmed =
    typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(composeMessage(title, message))
      : true;

  if (confirmed) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
