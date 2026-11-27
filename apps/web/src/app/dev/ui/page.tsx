import { Check, Settings, Trash2, Undo2, X } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ToastProvider } from '@/components/ui/toast';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { CssVariableValue } from './css-variable-value';
import {
  AlertDialogExample,
  DialogExample,
  DropdownMenuExample,
  SheetExample,
  ToastExamples,
} from './overlay-examples';

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

const buttonVariantNames = ['primary', 'secondary', 'ghost', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;
const badgeVariantNames = ['neutral', 'accent', 'success', 'warning', 'danger'] as const;

function ComponentSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h3 id={id} className="text-base font-semibold">
        {title}
      </h3>
      <div className="space-y-4 rounded-md border border-line bg-surface p-4">{children}</div>
    </section>
  );
}

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

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

      <TooltipProvider>
        <section aria-labelledby="components" className="space-y-8">
          <h2 id="components" className="text-lg font-semibold">
            Components
          </h2>

          <ComponentSection id="button" title="Button">
            {sizes.map((size) => (
              <Example key={size} label={`Size ${size}`}>
                {buttonVariantNames.map((variant) => (
                  <Button key={variant} variant={variant} size={size}>
                    {variant}
                  </Button>
                ))}
              </Example>
            ))}
            <Example label="With an icon">
              <Button variant="primary">
                <Check />
                Approve
              </Button>
              <Button variant="danger" size="lg">
                <Trash2 />
                Remove
              </Button>
            </Example>
            <Example label="Disabled">
              {buttonVariantNames.map((variant) => (
                <Button key={variant} variant={variant} disabled>
                  {variant}
                </Button>
              ))}
            </Example>
            <Example label="Loading (keeps its width, aria-busy)">
              {buttonVariantNames.map((variant) => (
                <Button key={variant} variant={variant} loading>
                  {variant}
                </Button>
              ))}
            </Example>
          </ComponentSection>

          <ComponentSection id="icon-button" title="IconButton">
            {sizes.map((size) => (
              <Example key={size} label={`Size ${size}; hover or focus shows the label`}>
                <IconButton label="Close" variant="ghost" size={size}>
                  <X />
                </IconButton>
                <IconButton label="Undo" size={size}>
                  <Undo2 />
                </IconButton>
                <IconButton label="Settings" variant="primary" size={size}>
                  <Settings />
                </IconButton>
                <IconButton label="Remove" variant="danger" size={size}>
                  <Trash2 />
                </IconButton>
              </Example>
            ))}
            <Example label="Disabled and loading">
              <IconButton label="Undo (disabled)" disabled>
                <Undo2 />
              </IconButton>
              <IconButton label="Remove (loading)" variant="danger" loading>
                <Trash2 />
              </IconButton>
            </Example>
          </ComponentSection>

          <ComponentSection id="kbd" title="Kbd">
            <p className="text-sm">
              Press <Kbd>J</Kbd> or <Kbd>K</Kbd> to move, <Kbd>?</Kbd> for help, <Kbd>Ctrl</Kbd> +{' '}
              <Kbd>Enter</Kbd> to submit.
            </p>
          </ComponentSection>

          <ComponentSection id="badge" title="Badge">
            <Example label="Variants">
              {badgeVariantNames.map((variant) => (
                <Badge key={variant} variant={variant}>
                  {variant}
                </Badge>
              ))}
            </Example>
          </ComponentSection>

          <ComponentSection id="checkbox" title="Checkbox">
            <div className="flex flex-col gap-3">
              <Checkbox label="Unchecked" />
              <Checkbox label="Checked" defaultChecked />
              <Checkbox label="Indeterminate" checked="indeterminate" />
              <Checkbox label="Disabled" disabled />
              <Checkbox label="Disabled and checked" disabled defaultChecked />
            </div>
          </ComponentSection>

          <ComponentSection id="switch" title="Switch">
            <div className="flex max-w-sm flex-col gap-4">
              <Switch
                label="Single-key shortcuts"
                description="J, K, A, R, B, Z and ? work without a modifier key."
              />
              <Switch label="On" defaultChecked />
              <Switch label="Disabled" disabled />
              <Switch label="Disabled and on" disabled defaultChecked />
            </div>
          </ComponentSection>

          <ComponentSection id="radio-group" title="RadioGroup">
            <RadioGroup label="Sort" description="The order of the queue." defaultValue="oldest">
              <RadioGroupItem value="oldest" label="Oldest first" />
              <RadioGroupItem value="newest" label="Newest first" />
              <RadioGroupItem
                value="reports"
                label="Most reports"
                description="Equal counts: oldest first."
              />
              <RadioGroupItem value="score" label="Disabled" disabled />
            </RadioGroup>
          </ComponentSection>

          <ComponentSection id="tooltip" title="Tooltip">
            <Example label="Opens after 400 ms on hover, at once on keyboard focus">
              <Tooltip content="Approves the current item">
                <Button>Hover or focus me</Button>
              </Tooltip>
            </Example>
          </ComponentSection>

          <ComponentSection id="field" title="Field, Input, Textarea, Select">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <Input placeholder="Spam or scam" />
              </Field>
              <Field label="Title" description="Shown in the remove dialog.">
                <Input defaultValue="Spam" />
              </Field>
              <Field label="Title" error="Enter a title.">
                <Input />
              </Field>
              <Field label="Title (disabled)">
                <Input defaultValue="Spam" disabled />
              </Field>
              <Field
                label="Message to the user"
                description="Placeholders: {{username}}, {{community}}."
              >
                <Textarea placeholder="Hi {{username}}, …" />
              </Field>
              <Field label="Message to the user" error="Use at most 1,000 characters.">
                <Textarea defaultValue="Hi {{username}}," />
              </Field>
              <Field label="Ban duration">
                <Select defaultValue="7">
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="permanent">Permanent</option>
                </Select>
              </Field>
              <Field label="Ban duration" error="Choose a duration.">
                <Select defaultValue="">
                  <option value="">Choose…</option>
                  <option value="1">1 day</option>
                </Select>
              </Field>
              <Field label="Ban duration (disabled)">
                <Select disabled>
                  <option>7 days</option>
                </Select>
              </Field>
            </div>
          </ComponentSection>

          <ComponentSection id="skeleton" title="Skeleton">
            <div className="flex gap-3">
              <Skeleton className="size-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </ComponentSection>

          <ComponentSection id="spinner" title="Spinner">
            <Example label="Default label and a custom label">
              <Spinner />
              <Spinner label="Loading the queue" />
            </Example>
          </ComponentSection>

          <ComponentSection id="visually-hidden" title="VisuallyHidden">
            <Example label="The button's name is visually hidden text">
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-md text-fg-muted hover:bg-canvas"
              >
                <X className="size-4" />
                <VisuallyHidden>Close</VisuallyHidden>
              </button>
            </Example>
          </ComponentSection>

          <ComponentSection id="dialog" title="Dialog">
            <Example label="Sizes sm, md and lg from md; the whole screen below md">
              <DialogExample size="sm" />
              <DialogExample size="md" />
              <DialogExample size="lg" />
            </Example>
            <Example label="Long content: only the body scrolls">
              <DialogExample size="md" long />
            </Example>
          </ComponentSection>

          <ComponentSection id="alert-dialog" title="AlertDialog">
            <Example label="Opens with the focus on Cancel; a click outside does not close it">
              <AlertDialogExample />
            </Example>
          </ComponentSection>

          <ComponentSection id="sheet" title="Sheet">
            <Example label='side="right" for tablet, side="full" for phone; data-hotkeys-scope="queue"'>
              <SheetExample side="right" />
              <SheetExample side="full" />
            </Example>
          </ComponentSection>

          <ComponentSection id="dropdown-menu" title="DropdownMenu">
            <Example label="Items, checkbox items, a radio group, labels and separators">
              <DropdownMenuExample />
            </Example>
          </ComponentSection>

          <ComponentSection id="toast" title="Toast">
            <Example label="Bottom right from md, above the bottom bar below md; F8 moves the focus to the toasts">
              <ToastProvider>
                <ToastExamples />
              </ToastProvider>
            </Example>
          </ComponentSection>
        </section>
      </TooltipProvider>
    </main>
  );
}
