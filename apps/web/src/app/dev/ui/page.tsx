import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CssVariableValue } from './css-variable-value';

export const metadata: Metadata = {
  title: 'UI showcase · ModQueue',
};

// Full class names, not built from the token: Tailwind finds utilities only as whole words.
const colours = [
  { token: 'canvas', swatch: 'bg-canvas' },
  { token: 'surface', swatch: 'bg-surface' },
  { token: 'surface-raised', swatch: 'bg-surface-raised' },
  { token: 'line', swatch: 'bg-line' },
  { token: 'line-strong', swatch: 'bg-line-strong' },
  { token: 'fg', swatch: 'bg-fg' },
  { token: 'fg-muted', swatch: 'bg-fg-muted' },
  { token: 'fg-subtle', swatch: 'bg-fg-subtle' },
  { token: 'accent', swatch: 'bg-accent' },
  { token: 'accent-hover', swatch: 'bg-accent-hover' },
  { token: 'accent-fg', swatch: 'bg-accent-fg' },
  { token: 'accent-subtle', swatch: 'bg-accent-subtle' },
  { token: 'focus', swatch: 'bg-focus' },
  { token: 'success', swatch: 'bg-success' },
  { token: 'success-subtle', swatch: 'bg-success-subtle' },
  { token: 'warning', swatch: 'bg-warning' },
  { token: 'warning-subtle', swatch: 'bg-warning-subtle' },
  { token: 'danger', swatch: 'bg-danger' },
  { token: 'danger-hover', swatch: 'bg-danger-hover' },
  { token: 'danger-fg', swatch: 'bg-danger-fg' },
  { token: 'danger-subtle', swatch: 'bg-danger-subtle' },
  { token: 'row-active', swatch: 'bg-row-active' },
  { token: 'row-selected', swatch: 'bg-row-selected' },
  { token: 'chart-1', swatch: 'bg-chart-1' },
  { token: 'chart-2', swatch: 'bg-chart-2' },
  { token: 'chart-3', swatch: 'bg-chart-3' },
  { token: 'chart-4', swatch: 'bg-chart-4' },
  { token: 'chart-5', swatch: 'bg-chart-5' },
  { token: 'scrim', swatch: 'bg-scrim' },
] as const;

const textBackgrounds = [
  { token: 'surface', className: 'bg-surface' },
  { token: 'canvas', className: 'bg-canvas' },
  { token: 'row-active', className: 'bg-row-active' },
  { token: 'row-selected', className: 'bg-row-selected' },
] as const;

const textColours = [
  { token: 'fg', className: 'text-fg' },
  { token: 'fg-muted', className: 'text-fg-muted' },
  { token: 'fg-subtle', className: 'text-fg-subtle' },
  { token: 'accent', className: 'text-accent' },
] as const;

const filledPairs = [
  { label: 'accent-fg on accent', className: 'bg-accent text-accent-fg' },
  { label: 'accent-fg on accent-hover', className: 'bg-accent-hover text-accent-fg' },
  { label: 'accent on accent-subtle', className: 'bg-accent-subtle text-accent' },
  { label: 'success on surface', className: 'bg-surface text-success' },
  { label: 'success on success-subtle', className: 'bg-success-subtle text-success' },
  { label: 'warning on surface', className: 'bg-surface text-warning' },
  { label: 'warning on warning-subtle', className: 'bg-warning-subtle text-warning' },
  { label: 'danger on surface', className: 'bg-surface text-danger' },
  { label: 'danger on danger-subtle', className: 'bg-danger-subtle text-danger' },
  { label: 'danger-fg on danger', className: 'bg-danger text-danger-fg' },
  { label: 'danger-fg on danger-hover', className: 'bg-danger-hover text-danger-fg' },
] as const;

const typeScale = [
  { token: 'text-xs', use: 'Meta text, badges, kbd' },
  { token: 'text-sm', use: 'Default UI text: rows, tables, forms, buttons' },
  { token: 'text-base', use: 'Content body in the preview, message text' },
  { token: 'text-lg', use: 'Dialog and section titles' },
  { token: 'text-xl', use: 'Page titles' },
] as const;

const radii = [
  { token: 'radius-sm', className: 'rounded-sm' },
  { token: 'radius-md', className: 'rounded-md' },
  { token: 'radius-lg', className: 'rounded-lg' },
] as const;

const shadows = [
  { token: 'shadow-sm', className: 'shadow-sm' },
  { token: 'shadow-md', className: 'shadow-md' },
  { token: 'shadow-lg', className: 'shadow-lg' },
] as const;

export default function DevUiPage() {
  // A page for manual QA: not part of the production app.
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') notFound();

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      <h1 className="text-xl font-semibold">UI showcase</h1>

      <section aria-labelledby="tokens" className="space-y-8">
        <h2 id="tokens" className="text-lg font-semibold">
          Tokens
        </h2>

        <section aria-labelledby="colours" className="space-y-3">
          <h3 id="colours" className="text-base font-semibold">
            Colours
          </h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {colours.map(({ token, swatch }) => (
              <li
                key={token}
                className="flex items-center gap-3 rounded-md border border-line bg-surface p-2"
              >
                <span
                  aria-hidden="true"
                  className={`size-10 shrink-0 rounded-sm border border-line ${swatch}`}
                />
                <span className="min-w-0">
                  <code className="block text-sm">{token}</code>
                  <span className="block text-xs text-fg-muted">
                    <CssVariableValue name={`--${token}`} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="text-pairs" className="space-y-3">
          <h3 id="text-pairs" className="text-base font-semibold">
            Text pairs
          </h3>
          <p className="text-sm text-fg-muted">
            Every text pair of the contrast table at 14 px. The E2E axe check fails on a pair below
            4.5:1.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {textBackgrounds.map((background) => (
              <li
                key={background.token}
                className={`space-y-1 rounded-md border border-line p-3 text-sm ${background.className}`}
              >
                {textColours.map((text) => (
                  <p key={text.token} className={text.className}>
                    {text.token} on {background.token}
                  </p>
                ))}
              </li>
            ))}
          </ul>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filledPairs.map(({ label, className }) => (
              <li key={label} className={`rounded-md border border-line p-3 text-sm ${className}`}>
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="type-scale" className="space-y-3">
          <h3 id="type-scale" className="text-base font-semibold">
            Type scale
          </h3>
          <ul className="space-y-3 rounded-md border border-line bg-surface p-4">
            {typeScale.map(({ token, use }) => (
              <li key={token}>
                <p className={token}>{use}</p>
                <p className="text-xs text-fg-muted">
                  <code>{token}</code> · <CssVariableValue name={`--${token}`} /> /{' '}
                  <CssVariableValue name={`--${token}--line-height`} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="radii" className="space-y-3">
          <h3 id="radii" className="text-base font-semibold">
            Radii
          </h3>
          <ul className="flex flex-wrap gap-6">
            {radii.map(({ token, className }) => (
              <li key={token} className="space-y-2">
                <span
                  aria-hidden="true"
                  className={`block size-16 border border-line-strong bg-surface ${className}`}
                />
                <p className="text-xs text-fg-muted">
                  <code>{token}</code> · <CssVariableValue name={`--${token}`} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shadows" className="space-y-3">
          <h3 id="shadows" className="text-base font-semibold">
            Shadows
          </h3>
          <ul className="grid gap-6 sm:grid-cols-3">
            {shadows.map(({ token, className }) => (
              <li key={token} className="space-y-2">
                <span
                  aria-hidden="true"
                  className={`block h-16 rounded-md bg-surface-raised ${className}`}
                />
                <p className="text-xs text-fg-muted">
                  <code>{token}</code> · <CssVariableValue name={`--${token}`} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
