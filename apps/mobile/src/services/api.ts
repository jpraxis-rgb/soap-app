import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.soap-app.com/api/v1';

const TOKEN_KEY = '@soap/auth_token';
const REFRESH_TOKEN_KEY = '@soap/refresh_token';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Try to refresh token
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newAuthHeaders = await getAuthHeaders();
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...newAuthHeaders,
          ...options.headers,
        },
      });

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
      }
      return retryResponse.json();
    }

    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    request<{ user: unknown; token: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ user: unknown; token: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  googleAuth: (token: string) =>
    request<{ user: unknown; token: string; refreshToken: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  appleAuth: (token: string) =>
    request<{ user: unknown; token: string; refreshToken: string }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  getMe: () => request<unknown>('/auth/me'),
};

// Users API
export const usersApi = {
  updateProfile: (data: { name?: string; avatar_url?: string }) =>
    request<unknown>('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateNotifications: (preferences: Record<string, boolean>) =>
    request<unknown>('/users/me/notifications', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    }),

  switchConcurso: (concursoId: string) =>
    request<unknown>('/users/me/concurso', {
      method: 'PUT',
      body: JSON.stringify({ concurso_id: concursoId }),
    }),
};

// Subscriptions API
export const subscriptionsApi = {
  create: (tier: string) =>
    request<unknown>('/subscriptions/create', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),

  cancel: () =>
    request<unknown>('/subscriptions/cancel', {
      method: 'POST',
    }),

  getCurrent: () =>
    request<{ tier: string; subscription: unknown }>('/subscriptions/current'),
};

// Token management helpers
export const tokenStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string) => AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),
  clearTokens: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
