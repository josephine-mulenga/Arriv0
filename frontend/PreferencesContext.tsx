import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App-wide personalization the user sets from /settings. Persisted locally —
// there's no backend field for any of these yet. Mirrors the AuthContext
// pattern (a Provider + a use*() hook) already established in this app.

export type Appearance = 'light' | 'dark' | 'system';
export type ReminderFrequency = 'once' | 'twice' | 'thrice';
export type ChatThemeKey = 'purple' | 'blue' | 'green' | 'sunset';

export interface ChatTheme {
  key: ChatThemeKey;
  label: string;
  accent: string;
  accentDark: string;
  tint: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  { key: 'purple', label: 'Purple', accent: '#6C63FF', accentDark: '#574FE0', tint: '#F1EFFF' },
  { key: 'blue', label: 'Ocean', accent: '#2F80D9', accentDark: '#256BB8', tint: '#EAF3FD' },
  { key: 'green', label: 'Forest', accent: '#2FB574', accentDark: '#259A62', tint: '#EAF7F1' },
  { key: 'sunset', label: 'Sunset', accent: '#D9722B', accentDark: '#B85F22', tint: '#FDF0E6' },
];

interface Preferences {
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
  reminderFrequency: ReminderFrequency;
  setReminderFrequency: (value: ReminderFrequency) => void;
  chatThemeKey: ChatThemeKey;
  setChatThemeKey: (value: ChatThemeKey) => void;
  chatTheme: ChatTheme;
  loaded: boolean;
}

const STORAGE_KEY = 'appPreferences';

const defaultPreferences = {
  appearance: 'light' as Appearance,
  reminderFrequency: 'once' as ReminderFrequency,
  chatThemeKey: 'purple' as ChatThemeKey,
};

const PreferencesContext = createContext<Preferences | null>(null);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [appearance, setAppearanceState] = useState<Appearance>(defaultPreferences.appearance);
  const [reminderFrequency, setReminderFrequencyState] = useState<ReminderFrequency>(
    defaultPreferences.reminderFrequency
  );
  const [chatThemeKey, setChatThemeKeyState] = useState<ChatThemeKey>(defaultPreferences.chatThemeKey);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.appearance) setAppearanceState(parsed.appearance);
          if (parsed.reminderFrequency) setReminderFrequencyState(parsed.reminderFrequency);
          if (parsed.chatThemeKey) setChatThemeKeyState(parsed.chatThemeKey);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  const persist = (next: Partial<typeof defaultPreferences>) => {
    const merged = { appearance, reminderFrequency, chatThemeKey, ...next };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(() => {});
  };

  const setAppearance = (value: Appearance) => {
    setAppearanceState(value);
    persist({ appearance: value });
  };
  const setReminderFrequency = (value: ReminderFrequency) => {
    setReminderFrequencyState(value);
    persist({ reminderFrequency: value });
  };
  const setChatThemeKey = (value: ChatThemeKey) => {
    setChatThemeKeyState(value);
    persist({ chatThemeKey: value });
  };

  const chatTheme = CHAT_THEMES.find((t) => t.key === chatThemeKey) ?? CHAT_THEMES[0];

  return (
    <PreferencesContext.Provider
      value={{
        appearance,
        setAppearance,
        reminderFrequency,
        setReminderFrequency,
        chatThemeKey,
        setChatThemeKey,
        chatTheme,
        loaded,
      }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
};
