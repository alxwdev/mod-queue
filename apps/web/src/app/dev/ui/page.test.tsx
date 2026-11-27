import { readFileSync } from 'node:fs';
import path from 'node:path';
import { screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { renderWithProviders } from '@/test/render';
import DevUiPage from './page';

// The colour tokens of globals.css: `--color-canvas: var(--canvas)` → `canvas`.
const css = readFileSync(path.join(__dirname, '../../globals.css'), 'utf8');
const colourTokens = Array.from(
  css.matchAll(/--color-([a-z0-9-]+):/g),
  ([, token]) => token,
).filter((token) => token !== undefined);

describe('DevUiPage', () => {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;

  afterEach(() => {
    if (appEnv === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
    else process.env.NEXT_PUBLIC_APP_ENV = appEnv;
    document.documentElement.removeAttribute('style');
  });

  it('shows a swatch for every colour token of globals.css', () => {
    renderWithProviders(<DevUiPage />, { route: '/dev/ui' });

    expect(colourTokens).toEqual(expect.arrayContaining(['canvas', 'chart-5', 'scrim']));
    for (const token of colourTokens) {
      expect(screen.getByText(token, { selector: 'code' })).toBeInTheDocument();
    }
  });

  it('shows the value that the browser gives a token', () => {
    document.documentElement.style.setProperty('--canvas', 'value-of-canvas');

    renderWithProviders(<DevUiPage />, { route: '/dev/ui' });

    expect(screen.getByText('value-of-canvas')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderWithProviders(<DevUiPage />, { route: '/dev/ui' });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('is not found in production', () => {
    process.env.NEXT_PUBLIC_APP_ENV = 'production';

    expect(() => DevUiPage()).toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});
