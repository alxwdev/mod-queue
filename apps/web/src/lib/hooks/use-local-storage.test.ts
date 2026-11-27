import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { useLocalStorage } from './use-local-storage';

function parseCount(stored: unknown): number {
  return typeof stored === 'number' ? stored : 0;
}

function Count({ storageKey }: { storageKey: string }) {
  const [count] = useLocalStorage(storageKey, parseCount);
  return createElement('p', null, count);
}

describe('useLocalStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('reads the stored value', () => {
    window.localStorage.setItem('count', '3');

    const { result } = renderHook(() => useLocalStorage('count', parseCount));

    expect(result.current[0]).toBe(3);
  });

  it('gives the parsed default for a missing value and for a value that is not JSON', () => {
    const { result: missing } = renderHook(() => useLocalStorage('count', parseCount));
    window.localStorage.setItem('broken', '{');
    const { result: broken } = renderHook(() => useLocalStorage('broken', parseCount));

    expect(missing.current[0]).toBe(0);
    expect(broken.current[0]).toBe(0);
  });

  it('writes the value to the storage and to every hook with the same key', () => {
    const { result: writer } = renderHook(() => useLocalStorage('count', parseCount));
    const { result: reader } = renderHook(() => useLocalStorage('count', parseCount));

    act(() => writer.current[1](5));

    expect(window.localStorage.getItem('count')).toBe('5');
    expect(writer.current[0]).toBe(5);
    expect(reader.current[0]).toBe(5);
  });

  it('follows a change that another tab makes', () => {
    const { result } = renderHook(() => useLocalStorage('count', parseCount));

    act(() => {
      window.localStorage.setItem('count', '7');
      window.dispatchEvent(new StorageEvent('storage', { key: 'count', newValue: '7' }));
    });

    expect(result.current[0]).toBe(7);
  });

  it('survives a storage that throws on every read and write', () => {
    const blocked = () => {
      throw new DOMException('The storage is blocked.', 'SecurityError');
    };
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked);

    // Its own key: the value that this test cannot save stays in memory until the module reloads.
    const { result } = renderHook(() => useLocalStorage('blocked-count', parseCount));
    expect(result.current[0]).toBe(0);

    act(() => result.current[1](2));

    expect(result.current[0]).toBe(2);
  });

  it('renders the parsed default on the server', () => {
    window.localStorage.setItem('count', '3');

    expect(renderToString(createElement(Count, { storageKey: 'count' }))).toBe('<p>0</p>');
  });
});
