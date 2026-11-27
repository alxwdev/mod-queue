'use client';

import { createContext, useMemo, type ReactNode } from 'react';
import { useLocalStorage } from '@/lib/hooks/use-local-storage';

const themes = ['system', 'light', 'dark'] as const;

/** The colour theme; the theme toggle and the dark tokens come with backlog item N2. */
export type Theme = (typeof themes)[number];

export type Settings = {
  /** Single-key shortcuts (`j`, `a`, `?` …); off for speech input users (WCAG 2.1.4). */
  shortcutsEnabled: boolean;
  theme: Theme;
};

export type SettingsContextValue = Settings & {
  updateSettings: (patch: Partial<Settings>) => void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);

const STORAGE_KEY = 'modqueue:settings';

const defaultSettings: Settings = { shortcutsEnabled: true, theme: 'system' };

function isTheme(value: unknown): value is Theme {
  return themes.some((theme) => theme === value);
}

// The stored object can be from an older version or edited by hand: keep only its valid fields.
function parseSettings(stored: unknown): Settings {
  if (typeof stored !== 'object' || stored === null) return defaultSettings;
  return {
    shortcutsEnabled:
      'shortcutsEnabled' in stored && typeof stored.shortcutsEnabled === 'boolean'
        ? stored.shortcutsEnabled
        : defaultSettings.shortcutsEnabled,
    theme: 'theme' in stored && isTheme(stored.theme) ? stored.theme : defaultSettings.theme,
  };
}

/** Holds the moderator's preferences and keeps them in localStorage. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage(STORAGE_KEY, parseSettings);

  const value = useMemo(
    () => ({
      ...settings,
      updateSettings: (patch: Partial<Settings>) => setSettings({ ...settings, ...patch }),
    }),
    [settings, setSettings],
  );

  return <SettingsContext value={value}>{children}</SettingsContext>;
}
