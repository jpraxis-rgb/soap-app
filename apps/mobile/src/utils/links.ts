import { Linking, Platform } from 'react-native';

// Public web origin where the static legal pages are hosted. On web we use a
// relative path (same origin as the served app); on native we need an absolute
// URL, configurable via EXPO_PUBLIC_WEB_URL with a sensible production default.
const WEB_ORIGIN =
  process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '') || 'https://estudatudo.vercel.app';

function pageUrl(path: string): string {
  if (Platform.OS === 'web') return path; // relative to current origin
  return `${WEB_ORIGIN}${path}`;
}

export const PRIVACY_URL = () => pageUrl('/privacy.html');
export const TERMS_URL = () => pageUrl('/terms.html');
export const SUPPORT_EMAIL = 'suporte@estudatudo.app';

export async function openUrl(url: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
