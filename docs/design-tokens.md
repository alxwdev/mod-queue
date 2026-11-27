# Design tokens

The tokens of the light theme. [`docs/plan/design.md`](plan/design.md) is the source, and
[`apps/web/src/app/globals.css`](../apps/web/src/app/globals.css) holds the values. A change goes
into `design.md`, `globals.css` and this file together. `/dev/ui` shows every colour, the type scale,
the radii and the shadows, outside production.

Components use the token names only, never raw values. Tailwind's own palette, text sizes, radii
and shadows are removed, so a class such as `bg-red-500` or `text-2xl` gives no CSS.

## Colours

Each colour works in every Tailwind colour utility: `bg-canvas`, `text-fg-muted`,
`border-line-strong`, `outline-focus` and so on. The variables on `:root` (`--canvas`) hold the
values; the dark theme (backlog item N2) will give them other values under `[data-theme="dark"]`.

| Token            | Value                 | Use                                                               |
| ---------------- | --------------------- | ----------------------------------------------------------------- |
| `canvas`         | `#f5f6f8`             | Page background, sidebar, neutral badge background                |
| `surface`        | `#ffffff`             | List, preview, cards, inputs                                      |
| `surface-raised` | `#ffffff`             | Menus, dialogs, sheets, toasts (always with a shadow)             |
| `line`           | `#e3e6eb`             | Dividers and card borders; never the only boundary of a control   |
| `line-strong`    | `#7f8796`             | Borders of inputs, checkboxes, switches, secondary buttons        |
| `fg`             | `#1a1d23`             | Primary text                                                      |
| `fg-muted`       | `#4b5563`             | Secondary text                                                    |
| `fg-subtle`      | `#5e6776`             | Meta text (age, counts), placeholders                             |
| `accent`         | `#3451d1`             | Primary buttons, links, active navigation item, active-row border |
| `accent-hover`   | `#2a41ae`             | Hover and pressed state of `accent`                               |
| `accent-fg`      | `#ffffff`             | Text and icons on `accent`                                        |
| `accent-subtle`  | `#edf0fd`             | Accent badge background                                           |
| `focus`          | `#2563eb`             | Focus ring                                                        |
| `success`        | `#17794a`             | Success text and icon                                             |
| `success-subtle` | `#e4f4ea`             | Success badge background                                          |
| `warning`        | `#8a5a00`             | Warning text and icon                                             |
| `warning-subtle` | `#fdf1d3`             | Warning badge background                                          |
| `danger`         | `#c02626`             | Danger buttons, error text and icon                               |
| `danger-hover`   | `#a11e1e`             | Hover and pressed state of `danger`                               |
| `danger-fg`      | `#ffffff`             | Text on `danger`                                                  |
| `danger-subtle`  | `#fceaea`             | Danger badge and error background                                 |
| `row-active`     | `#eef1f6`             | Background of the current queue item                              |
| `row-selected`   | `#e3e9fd`             | Background of bulk-selected queue items                           |
| `chart-1`        | `#3451d1`             | Chart marks (blue); the only colour of the Queue health charts    |
| `chart-2`        | `#783c84`             | Chart marks (purple), reserved for the backlog                    |
| `chart-3`        | `#6c8418`             | Chart marks (olive), reserved for the backlog                     |
| `chart-4`        | `#0c9cb4`             | Chart marks (cyan), reserved for the backlog                      |
| `chart-5`        | `#fc486c`             | Chart marks (pink), reserved for the backlog                      |
| `scrim`          | `rgb(16 24 40 / 0.4)` | Behind dialogs and sheets                                         |

## Other tokens

| Token                | Utility                        | Value                                        | Use                                         |
| -------------------- | ------------------------------ | -------------------------------------------- | ------------------------------------------- |
| `--text-xs`          | `text-xs`                      | 0.75rem / 1rem (12 / 16 px)                  | Meta text, badges, `kbd`                    |
| `--text-sm`          | `text-sm`                      | 0.875rem / 1.25rem (14 / 20 px)              | Default UI text                             |
| `--text-base`        | `text-base`                    | 1rem / 1.5rem (16 / 24 px)                   | Content body, message text, inputs on phone |
| `--text-lg`          | `text-lg`                      | 1.125rem / 1.75rem (18 / 28 px)              | Dialog and section titles                   |
| `--text-xl`          | `text-xl`                      | 1.25rem / 1.75rem (20 / 28 px)               | Page titles                                 |
| `--font-sans`        | `font-sans` (the default)      | Inter through `next/font`, then system fonts | All text                                    |
| `--font-mono`        | `font-mono` (`kbd` and `code`) | Tailwind's `ui-monospace` stack              | Keyboard keys                               |
| `--radius-sm`        | `rounded-sm`                   | 4px                                          | Badges, `kbd`, checkboxes                   |
| `--radius-md`        | `rounded-md`                   | 6px                                          | Buttons, inputs, menus                      |
| `--radius-lg`        | `rounded-lg`                   | 10px                                         | Dialogs, cards, toasts                      |
| `--shadow-sm`        | `shadow-sm`                    | `0 1px 2px rgb(16 24 40 / 0.06)`             | Sticky bars                                 |
| `--shadow-md`        | `shadow-md`                    | `0 4px 12px rgb(16 24 40 / 0.1)`             | Menus, tooltips, toasts                     |
| `--shadow-lg`        | `shadow-lg`                    | `0 12px 32px rgb(16 24 40 / 0.16)`           | Dialogs, sheets                             |
| `--duration-fast`    | `duration-fast`, `transition`  | 120ms; 0ms under `prefers-reduced-motion`    | Hover, focus, pressed                       |
| `--duration-base`    | `duration-base`                | 200ms; 0ms under `prefers-reduced-motion`    | Dialogs, sheets, toasts (with `ease-out`)   |
| `--z-index-sticky`   | `z-sticky`                     | 10                                           | Sticky bars                                 |
| `--z-index-overlay`  | `z-overlay`                    | 20                                           | Dialogs and sheets with their scrim         |
| `--z-index-dropdown` | `z-dropdown`                   | 30                                           | Menus and tooltips                          |
| `--z-index-toast`    | `z-toast`                      | 40                                           | Toasts                                      |

The text sizes are in rem, so they follow the browser font size; the px values apply at the
default 16 px. The transition utilities without a duration (`transition`, `transition-colors`) use
`--duration-fast` too, so they also stop under `prefers-reduced-motion`. Menus and tooltips sit
above the overlay because Radix renders them in a portal at the end of `<body>`: a menu that opens
in a dialog or a sheet must cover the scrim.

## Contrast

WCAG 2 contrast ratios, recomputed from the values in `globals.css` with a small script; they equal
the ratios in `design.md`. Text needs at least 4.5:1 (all text in the app is below the large-text
size); UI parts and the focus ring need at least 3:1. The `/dev/ui` page shows every text pair, and
the E2E axe check of the page fails on a text pair below 4.5:1.

| Foreground    | Min | On `surface` | On `canvas` | On `row-active` | On `row-selected` |
| ------------- | --- | ------------ | ----------- | --------------- | ----------------- |
| `fg`          | 4.5 | 16.88        | 15.61       | 14.91           | 13.94             |
| `fg-muted`    | 4.5 | 7.56         | 6.99        | 6.68            | 6.24              |
| `fg-subtle`   | 4.5 | 5.71         | 5.28        | 5.04            | 4.72              |
| `accent`      | 4.5 | 6.47         | 5.99        | 5.72            | 5.35              |
| `focus`       | 3   | 5.17         | 4.78        | 4.57            | 4.27              |
| `line-strong` | 3   | 3.62         | 3.34        | 3.19, not used  | 2.99, not used    |

| Foreground  | Background       | Min | Ratio |
| ----------- | ---------------- | --- | ----- |
| `accent-fg` | `accent`         | 4.5 | 6.47  |
| `accent-fg` | `accent-hover`   | 4.5 | 8.52  |
| `accent`    | `accent-subtle`  | 4.5 | 5.70  |
| `success`   | `surface`        | 4.5 | 5.43  |
| `success`   | `success-subtle` | 4.5 | 4.76  |
| `warning`   | `surface`        | 4.5 | 5.93  |
| `warning`   | `warning-subtle` | 4.5 | 5.28  |
| `danger`    | `surface`        | 4.5 | 5.92  |
| `danger`    | `danger-subtle`  | 4.5 | 5.10  |
| `danger-fg` | `danger`         | 4.5 | 5.92  |
| `danger-fg` | `danger-hover`   | 4.5 | 7.72  |
| `chart-1`   | `surface`        | 3   | 6.47  |
| `chart-2`   | `surface`        | 3   | 7.56  |
| `chart-3`   | `surface`        | 3   | 4.24  |
| `chart-4`   | `surface`        | 3   | 3.27  |
| `chart-5`   | `surface`        | 3   | 3.34  |

Do not put bordered controls on a queue row: `line-strong` is below 3:1 on `row-selected`. The row
checkbox area is decorative and its check icon uses `accent`.

The chart colours were also checked for colour-blind readers; the table and the method are in
[`design.md`](plan/design.md#chart-colours-for-colour-blind-readers). Repeat that check when a chart
colour changes.
