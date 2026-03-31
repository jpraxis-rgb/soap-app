// Google OAuth2 for Web — uses backend redirect flow
// The popup redirects through: Railway API → Google → Railway callback → auth-callback.html
// auth-callback.html stores the result in localStorage, then closes itself.
// This file polls localStorage for the result.

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : (process.env.EXPO_PUBLIC_API_URL || 'https://soap-api-production-3290.up.railway.app/api/v1');

interface GoogleAuthResult {
  user: unknown;
  token: string;
  refreshToken: string;
}

const LS_RESULT_KEY = 'google_auth_result';
const LS_ERROR_KEY = 'google_auth_error';

export async function signInWithGoogleWeb(): Promise<GoogleAuthResult> {
  // Clear any stale values
  localStorage.removeItem(LS_RESULT_KEY);
  localStorage.removeItem(LS_ERROR_KEY);

  return new Promise((resolve, reject) => {
    const popupWidth = 500;
    const popupHeight = 600;
    const left = window.screenX + (window.innerWidth - popupWidth) / 2;
    const top = window.screenY + (window.innerHeight - popupHeight) / 2;

    const popup = window.open(
      `${API_BASE_URL}/auth/google/redirect`,
      'google-auth',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes`,
    );

    if (!popup) {
      reject(new Error('Popup bloqueado. Permita popups para este site.'));
      return;
    }

    let settled = false;

    function handleResult(authData: string) {
      localStorage.removeItem(LS_RESULT_KEY);
      if (!popup!.closed) popup!.close();
      try {
        const result = JSON.parse(atob(authData)) as GoogleAuthResult;
        resolve(result);
      } catch {
        reject(new Error('Erro ao processar resposta do Google.'));
      }
    }

    function handleError(authError: string) {
      localStorage.removeItem(LS_ERROR_KEY);
      if (!popup!.closed) popup!.close();
      try {
        const err = JSON.parse(atob(authError)) as { error: string };
        reject(new Error(err.error));
      } catch {
        reject(new Error('Erro ao entrar com Google.'));
      }
    }

    function cleanup() {
      clearInterval(pollTimer);
      window.removeEventListener('storage', onStorage);
    }

    function checkLocalStorage(): boolean {
      const authData = localStorage.getItem(LS_RESULT_KEY);
      const authError = localStorage.getItem(LS_ERROR_KEY);
      if (authData) {
        settled = true;
        cleanup();
        handleResult(authData);
        return true;
      } else if (authError) {
        settled = true;
        cleanup();
        handleError(authError);
        return true;
      }
      return false;
    }

    // Listen for storage events (fires cross-window when localStorage changes)
    function onStorage(e: StorageEvent) {
      if (settled) return;
      if (e.key === LS_RESULT_KEY && e.newValue) {
        settled = true;
        cleanup();
        handleResult(e.newValue);
      } else if (e.key === LS_ERROR_KEY && e.newValue) {
        settled = true;
        cleanup();
        handleError(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);

    // Poll localStorage as fallback (storage event doesn't fire in same window)
    let closedRetries = 0;
    const pollTimer = setInterval(() => {
      if (settled) return;

      // Check if popup was closed without completing auth
      if (popup.closed) {
        if (!checkLocalStorage()) {
          // Give localStorage a few more polls after popup closes (race condition)
          closedRetries++;
          if (closedRetries > 5) {
            settled = true;
            cleanup();
            reject(new Error('Login cancelado.'));
          }
        }
        return;
      }

      checkLocalStorage();
    }, 300);

    // Safety timeout — 2 minutes
    setTimeout(() => {
      if (!settled) {
        settled = true;
        cleanup();
        if (!popup.closed) popup.close();
        reject(new Error('Tempo limite atingido. Tente novamente.'));
      }
    }, 120000);
  });
}
