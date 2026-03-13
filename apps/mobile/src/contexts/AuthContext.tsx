import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, tokenStorage } from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  auth_provider: string;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  subscriptionTier: string;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    // Dev bypass disabled for demo — show onboarding flow
    // if (__DEV__) {
    //   try {
    //     const result = await authApi.register('dev@soap.app', 'dev12345', 'Dev User')
    //       .catch(() => authApi.login('dev@soap.app', 'dev12345'));
    //     await tokenStorage.setToken(result.token);
    //     await tokenStorage.setRefreshToken(result.refreshToken);
    //     setUser(result.user as AuthUser);
    //   } catch {
    //     setUser({
    //       id: 'dev-user-1',
    //       email: 'dev@soap.app',
    //       name: 'Dev User',
    //       avatar_url: null,
    //       auth_provider: 'email',
    //       subscription_tier: 'mentor',
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString(),
    //     });
    //   }
    //   setIsLoading(false);
    //   return;
    // }

    try {
      const token = await tokenStorage.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await authApi.getMe() as AuthUser;
      setUser(userData);
    } catch {
      await tokenStorage.clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    await tokenStorage.setToken(result.token);
    await tokenStorage.setRefreshToken(result.refreshToken);
    setUser(result.user as AuthUser);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const result = await authApi.register(email, password, name);
    await tokenStorage.setToken(result.token);
    await tokenStorage.setRefreshToken(result.refreshToken);
    setUser(result.user as AuthUser);
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe() as AuthUser;
      setUser(userData);
    } catch {
      // Ignore errors during refresh
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    subscriptionTier: user?.subscription_tier || 'free',
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
