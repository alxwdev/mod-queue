import { act, renderHook } from '@testing-library/react';
import { SettingsProvider } from './settings-provider';
import { useSettings } from './use-settings';

const STORAGE_KEY = 'modqueue:settings';

function renderSettings() {
  return renderHook(() => useSettings(), { wrapper: SettingsProvider });
}

describe('SettingsProvider', () => {
  afterEach(() => window.localStorage.clear());

  it('turns single-key shortcuts on by default and follows the system theme', () => {
    const { result } = renderSettings();

    expect(result.current).toMatchObject({ shortcutsEnabled: true, theme: 'system' });
  });

  it('saves a change in localStorage and keeps the other settings', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'dark' }));
    const { result } = renderSettings();

    act(() => result.current.updateSettings({ shortcutsEnabled: false }));

    expect(result.current).toMatchObject({ shortcutsEnabled: false, theme: 'dark' });
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual({
      shortcutsEnabled: false,
      theme: 'dark',
    });
  });

  it('replaces invalid stored values with the defaults', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ shortcutsEnabled: 'no', theme: 'sepia' }),
    );
    const { result } = renderSettings();

    expect(result.current).toMatchObject({ shortcutsEnabled: true, theme: 'system' });
  });

  it('needs a SettingsProvider', () => {
    // React logs the error of a failed render; the test expects the error.
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings needs a SettingsProvider above it.',
    );
  });
});
