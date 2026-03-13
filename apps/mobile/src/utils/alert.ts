import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on web (window.alert) and native (Alert.alert).
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform confirm dialog.
 * On web, uses window.confirm (synchronous).
 * On native, uses Alert.alert with Cancel/Confirm buttons.
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
