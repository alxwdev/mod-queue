# Visual design brief

This file is the source for task 2.6 (tokens) and tasks 4.1–4.2 (UI kit). Components use the token names only, never raw values.

## Direction

A calm, dense work console. Flat surfaces, hairline borders, one accent colour. Colour appears only where it carries meaning (accent, status, selection). No gradients and no decorative illustrations. Shadows only on floating layers (menus, dialogs, sheets, toasts).

## Colour tokens (light theme)

| Token | Value | Use |
|---|---|---|
| `canvas` | `#F5F6F8` | Page background, sidebar, neutral badge background |
| `surface` | `#FFFFFF` | List, preview, cards, inputs |
| `surface-raised` | `#FFFFFF` | Menus, dialogs, sheets, toasts (always with a shadow) |
| `line` | `#E3E6EB` | Dividers and card borders. Decorative: never the only boundary of a control |
| `line-strong` | `#7F8796` | Borders of inputs, checkboxes, switches, secondary buttons |
| `fg` | `#1A1D23` | Primary text |
| `fg-muted` | `#4B5563` | Secondary text |
| `fg-subtle` | `#5E6776` | Meta text (age, counts), placeholders |
| `accent` | `#3451D1` | Primary buttons, links, active navigation item, active-row border |
| `accent-hover` | `#2A41AE` | Hover and pressed state of `accent` |
| `accent-fg` | `#FFFFFF` | Text and icons on `accent` |
| `accent-subtle` | `#EDF0FD` | Accent badge background |
| `focus` | `#2563EB` | Focus ring |
| `success` / `success-subtle` | `#17794A` / `#E4F4EA` | Success text and icon / badge background |
| `warning` / `warning-subtle` | `#8A5A00` / `#FDF1D3` | Warning text and icon / badge background |
| `danger` / `danger-hover` | `#C02626` / `#A11E1E` | Danger buttons, error text and icon |
| `danger-fg` / `danger-subtle` | `#FFFFFF` / `#FCEAEA` | Text on `danger` / badge and error background |
| `row-active` | `#EEF1F6` | Background of the current queue item |
| `row-selected` | `#E3E9FD` | Background of bulk-selected queue items |
| `chart-1` … `chart-5` | `#3451D1`, `#783C84`, `#6C8418`, `#0C9CB4`, `#FC486C` | Chart marks (blue, purple, olive, cyan, pink) |

## Contrast

Computed with the WCAG 2 formula. Text needs at least 4.5:1; UI parts and the focus ring need at least 3:1. Task 2.6 recomputes this table in `docs/design-tokens.md`.

| Foreground | On `surface` | On `canvas` | On `row-active` | On `row-selected` |
|---|---|---|---|---|
| `fg` | 16.88 | 15.61 | 14.91 | 13.94 |
| `fg-muted` | 7.56 | 6.99 | 6.68 | 6.24 |
| `fg-subtle` | 5.71 | 5.28 | 5.04 | 4.72 |
| `accent` | 6.47 | 5.99 | 5.72 | 5.35 |
| `focus` (≥ 3) | 5.17 | 4.78 | 4.57 | 4.27 |
| `line-strong` (≥ 3) | 3.62 | 3.34 | not used | 2.99, not used |

| Pair | Ratio |
|---|---|
| `accent-fg` on `accent` / on `accent-hover` | 6.47 / 8.52 |
| `accent` on `accent-subtle` | 5.70 |
| `success` on `surface` / on `success-subtle` | 5.43 / 4.76 |
| `warning` on `surface` / on `warning-subtle` | 5.93 / 5.28 |
| `danger` on `surface` / on `danger-subtle` | 5.92 / 5.10 |
| `danger-fg` on `danger` / on `danger-hover` | 5.92 / 7.72 |
| `chart-1` … `chart-5` on `surface` (≥ 3) | 6.47, 7.56, 4.24, 3.27, 3.34 |

Do not put bordered controls on a selected row: `line-strong` on `row-selected` is below 3:1. The row checkbox area is decorative and its check icon uses `accent`.

### Chart colours for colour-blind readers

Each pair of chart colours was compared in normal vision and under simulated protanopia, deuteranopia and tritanopia (Machado 2009 matrices). The number is the colour difference in OKLab × 100. Targets: at least 15 in normal vision and at least 8 under every simulation.

| Pair | Normal | Protan | Deutan | Tritan |
|---|---|---|---|---|
| `chart-1` – `chart-2` | 16.2 | 13.1 | 12.8 | 16.2 |
| `chart-1` – `chart-3` | 32.6 | 30.9 | 31.3 | 11.2 |
| `chart-1` – `chart-4` | 21.6 | 20.6 | 18.9 | 15.1 |
| `chart-1` – `chart-5` | 37.3 | 20.5 | 32.8 | 36.1 |
| `chart-2` – `chart-3` | 28.0 | 26.2 | 21.7 | 14.9 |
| `chart-2` – `chart-4` | 26.1 | 24.8 | 17.2 | 26.6 |
| `chart-2` – `chart-5` | 26.9 | 16.9 | 26.9 | 25.5 |
| `chart-3` – `chart-4` | 18.5 | 19.2 | 18.2 | 12.6 |
| `chart-3` – `chart-5` | 29.9 | 11.0 | 11.1 | 27.1 |
| `chart-4` – `chart-5` | 32.2 | 13.0 | 14.9 | 36.2 |

All ten pairs pass (lowest value: 11.0). If a chart colour changes, repeat this check; a quick visual check is Chrome DevTools → Rendering → "Emulate vision deficiencies".

## Typography

- Font: Inter through `next/font` (`--font-sans`); `ui-monospace` stack for `kbd`.
- Weights: 400 (text), 500 (labels, buttons, row titles), 600 (headings).
- `tabular-nums` for counts, ages and table numbers.
- The content body in the preview is at most 70 characters wide.

| Size / line height | Use |
|---|---|
| 12 / 16 px | Meta text, badges, `kbd` |
| 14 / 20 px | Default UI text: queue rows, tables, forms, buttons, menus |
| 16 / 24 px | Content body in the preview, message text; inputs on phone (prevents zoom on focus) |
| 18 / 28 px | Dialog and section titles |
| 20 / 28 px | Page titles |

## Density and sizes

| Item | Value |
|---|---|
| Spacing grid | 4 px |
| Control heights | 32 px (sm: toolbars), 36 px (md: forms, the default), 44 px (lg: phone bottom bar) |
| Queue row | 72 px on desktop and tablet, 88 px on phone (fixed heights) |
| Header | 48 px |
| Sidebar (from `lg`) | 14 rem |
| Page padding | 16 px on phone, 24 px from `md` |
| Icons (`lucide-react`) | 16 px; 20 px in lg buttons |
| Touch targets | at least 24 × 24 px; 44 × 44 px in the phone bottom bar |

## Shape, elevation, motion

| Token | Value | Use |
|---|---|---|
| Radius `sm` / `md` / `lg` | 4 / 6 / 10 px | Badges, `kbd`, checkboxes / buttons, inputs, menus / dialogs, cards, toasts |
| Shadow `sm` | `0 1px 2px rgb(16 24 40 / 0.06)` | Sticky bars |
| Shadow `md` | `0 4px 12px rgb(16 24 40 / 0.10)` | Menus, tooltips, toasts |
| Shadow `lg` | `0 12px 32px rgb(16 24 40 / 0.16)` | Dialogs, sheets |
| Overlay scrim | `rgb(16 24 40 / 0.4)` | Behind dialogs and sheets |
| `--duration-fast` | 120 ms | Hover, focus, pressed |
| `--duration-base` | 200 ms | Dialogs, sheets, toasts (ease-out) |

All durations are 0 under `prefers-reduced-motion`.

## Component look

- **Buttons.** Primary: `accent` background, `accent-fg` text. Secondary: `surface` background, `line-strong` border, `fg` text. Ghost: transparent, `fg-muted` text, `canvas` background on hover. Danger: `danger` background, `danger-fg` text.
- **Badges.** A `*-subtle` background with the matching text colour (`accent`, `success`, `warning`, `danger`); neutral is `canvas` + `fg-muted`. A badge always has text, colour is never the only signal.
- **Queue rows.** Current item: `row-active` background and a 3 px `accent` left border. Bulk-selected: `row-selected` background and a check icon. Both can apply at once (selected background + active border).
- **Focus ring.** `outline: 2px solid var(--color-focus); outline-offset: 2px` everywhere; inside queue rows the offset is `-2px` so the ring is not clipped.
- **Charts.** Each of the three Queue health charts has one series and uses `chart-1`. Axis and label text uses `fg-muted`, grid lines use `line`. `chart-2` … `chart-5` are reserved for the backlog. Use them in this fixed order, never as the only signal (add a legend or direct labels), and never for status: `success`, `warning` and `danger` keep that job.
- **Dark theme.** Backlog item N2. Its values are not defined here.

## Owner review

1. After task 2.6: the owner looks at the "Tokens" section of `/dev/ui` (swatches, type scale, radii, shadows) and approves or changes the values. Changes go into this file and `globals.css` together, before task 4.1 starts.
2. At the end of Day 4: the owner looks at `/dev/ui` with all components at 320, 768 and 1280 px.
