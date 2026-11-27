import { use } from 'react';
import { SettingsContext, type SettingsContextValue } from './settings-provider';

/** Returns the moderator's settings and `updateSettings(patch)`, which saves a change. */
export function useSettings(): SettingsContextValue {
  const context = use(SettingsContext);
  if (!context) throw new Error('useSettings needs a SettingsProvider above it.');
  return context;
}
