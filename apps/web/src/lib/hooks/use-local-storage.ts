import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Values that localStorage refused to save (private mode, full storage). They last until the page
// closes, so a setting still works in this tab.
const unsaved = new Map<string, string>();
const listeners = new Set<() => void>();

function readStored(key: string): string | null {
  const value = unsaved.get(key);
  if (value !== undefined) return value;
  try {
    return window.localStorage.getItem(key);
  } catch {
    // The browser can block the storage (private mode, site settings): the hook then shows the
    // default value, which is a correct state.
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
    unsaved.delete(key);
  } catch {
    unsaved.set(key, value);
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the storage.
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

function parseJson(stored: string | null): unknown {
  if (stored === null) return undefined;
  try {
    return JSON.parse(stored);
  } catch {
    return undefined;
  }
}

/**
 * Keeps a JSON value in localStorage under `key`. `parse` turns the stored value (`undefined` when
 * there is none or it is not JSON) into a valid one. The server renders `parse(undefined)`.
 */
export function useLocalStorage<T>(
  key: string,
  parse: (stored: unknown) => T,
): [T, (value: T) => void] {
  // A string snapshot: useSyncExternalStore compares it by value, so a read gives no new render.
  const stored = useSyncExternalStore(
    subscribe,
    () => readStored(key),
    () => null,
  );
  const value = useMemo(() => parse(parseJson(stored)), [parse, stored]);
  const setValue = useCallback((next: T) => writeStored(key, JSON.stringify(next)), [key]);
  return [value, setValue];
}
