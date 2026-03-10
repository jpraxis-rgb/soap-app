import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@soap/notification_preferences';

interface NotificationPreferences {
  studyReminders: boolean;
  dailyGoals: boolean;
  weeklyReport: boolean;
  contentUpdates: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  studyReminders: true,
  dailyGoals: true,
  weeklyReport: true,
  contentUpdates: false,
};

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const updated = { ...preferences, [key]: value };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setPreferences(updated);
    } catch (error) {
      console.error('Failed to save notification preference:', error);
    }
  }, [preferences]);

  return { preferences, updatePreference, isLoading };
}
