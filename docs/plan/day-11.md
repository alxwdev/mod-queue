# Day 11: E2E on tablet and phone, performance, accessibility

**Goal:** prove the quality goals in a real browser and enforce them in CI.
**Complexity:** High · **Must:** 6.5 h · **Branch:** `day-11-e2e-perf-a11y`
**Demo:** a CI run with E2E on three viewports and Lighthouse CI, all green; `docs/quality.md` has the numbers.
**Read first:** [conventions.md](conventions.md), [testing.md](testing.md), [architecture.md](architecture.md) ("Responsive layout").

## 11.1 E2E: tablet and phone
Must · M · 1.25 h · Depends on: 10.4, 9.2, 6.2

| Spec | Projects | What it proves |
|---|---|---|
| `tablet.spec.ts` | tablet | Tap → slide-over; actions inside; `Esc` closes and focus returns to the row; axe. |
| `phone.spec.ts` | phone | Tap → full-screen item; bottom-bar buttons ≥ 44 px; after an action the next item shows; Back returns to the list; the remove dialog is full-screen; at 320 px no horizontal scroll on all four screens (`scrollWidth <= innerWidth`, data-table regions excluded); every interactive element ≥ 24×24 px; axe. |

Files: `apps/web/e2e/{tablet.spec.ts,phone.spec.ts}` (new).
Tests: the two specs.
Done when: both specs pass locally three times in a row.

## 11.2 E2E: supporting screens, conflict, bulk performance
Must · M · 1.5 h · Depends on: 10.4, 10.1, 10.2, 9.3, 7.2

| Spec | Projects | What it proves |
|---|---|---|
| `mod-log.spec.ts` | desktop, phone | Filters, search, load more; cards are visible on phone and the table on desktop. |
| `health.spec.ts` | desktop, phone | Tiles, three figures, the data table opens; one column on phone. |
| `reasons.spec.ts` | desktop | Create → the reason shows up in the remove dialog; edit; archive → it is gone from the dialog. |
| `conflict.spec.ts` | desktop | Two browser contexts (mod_aurora, mod_birch): B approves item X; A approves the stale X → warning toast "already handled by mod_birch". |
| `bulk-perf.spec.ts` | desktop | Load 4 pages (`End` key), select all (200), press `a`; the longest `keydown` Event Timing entry is under 200 ms; at most 60 rows are in the DOM. |

INP measurement for `bulk-perf.spec.ts`: before pressing `a`, start a `PerformanceObserver` for `{ type: 'event', durationThreshold: 16, buffered: true }` in the page, keep the entries on `window`, and after the toast "Approved 200 items" is visible, read the max `duration` of entries whose name starts with `key`.

Files: `apps/web/e2e/{mod-log.spec.ts,health.spec.ts,reasons.spec.ts,conflict.spec.ts,bulk-perf.spec.ts}` (new).
Tests: the five specs.
Done when: the whole E2E suite (tasks 10.5, 11.1, 11.2) passes locally three times in a row (`--repeat-each=3` once, to catch flaky tests).

## 11.3 Performance pass and Lighthouse CI
Must · M · 2 h · Depends on: 11.2, 10.5

Steps:
1. Bundle check with `@next/bundle-analyzer` (`cross-env ANALYZE=1 pnpm build`): first-load JS of `/queue` ≤ 250 KB compressed. The moderation dialog (RHF, Zod resolver) and Recharts must be in lazy chunks; no Sentry Replay.
2. React Profiler while holding `j`: only the two changed rows and the preview re-render. Fix with `memo`, stable callbacks, or `useDeferredValue` for the preview id if needed. The bulk path does a single cache write.
3. `lighthouserc.json`: `startServerCommand` = `pnpm --filter @modqueue/web start`; URLs `/queue`, `/log`, `/health`, `/reasons`; `numberOfRuns: 3`; `preset: 'desktop'`; assertions: performance, accessibility and best-practices `minScore 0.95` (median run), `largest-contentful-paint ≤ 2500`, `cumulative-layout-shift ≤ 0.1`, `total-blocking-time ≤ 200` (warn), `resource-summary:script:size ≤ 262144`; upload to temporary public storage.
4. Add an LHCI step to the CI `e2e` job (it reuses the build and the seeded database).
5. Record the numbers (Lighthouse, bundle sizes, bulk INP, scroll profile) in `docs/quality.md`.

Fallback rules:
- If runner noise makes the 0.95 performance gate flaky, set the CI gate to 0.90 and keep 95+ as the release target measured on production (record both numbers).
- If the script-size assertion fails only because of the idle preload of the moderation dialog chunk (task 9.2), start that preload on the first key press or pointer move instead of on idle.
- If LCP fails, do backlog item N3.

Files: `lighthouserc.json` (new); `.github/workflows/ci.yml`, `apps/web/next.config.ts`, `docs/quality.md` (modify); component files only where the profiler shows a problem.
Tests: no new test files; the LHCI assertions and `bulk-perf.spec.ts` are the checks.
Done when: LHCI passes in CI; `bulk-perf.spec.ts` passes; `docs/quality.md` has every number from step 5.

## 11.4 Coverage gate
Must · S · 0.5 h · Depends on: 11.2

Steps: turn on the coverage thresholds in CI (80 % lines for hooks and utilities, configured in tasks 1.5 and 2.1). Add tests where a folder is below the bar. Put the coverage summary in `docs/quality.md`.

Files: the three `jest.config.ts` files, `docs/quality.md` (modify); new test files only where coverage is missing.
Tests: whatever is needed to reach the thresholds.
Done when: `pnpm test:coverage` fails locally when a threshold is raised above the measured value by hand, and passes as committed; the CI `quality` job is green.

## 11.5 Accessibility audit
Must · M · 1.25 h · Depends on: 10.5, 11.1

Manual checklist. The agent prepares the checklist and fixes what fails; the **Owner** runs the assistive-technology checks. Results go into `docs/accessibility.md` (what was tested, how, known limits):

- NVDA + Chrome on all four screens; a quick Narrator check.
- Keyboard only through every screen and dialog; visible focus everywhere.
- Zoom to 200 %; reflow at 400 % (1280 px → 320 CSS px).
- Windows forced-colors mode (focus ring and selected rows still visible).
- `prefers-reduced-motion`; the text-spacing bookmarklet; heading order, landmarks and page titles.

Files: `docs/accessibility.md` (modify); component files for the fixes.
Tests: a regression test for every bug that is fixed in code.
Done when: every line of the checklist has a result in `docs/accessibility.md`; every failed check is fixed or listed under "Known limits" with a backlog ID.

## End of the day

**Owner**: commit, push, merge the pull request when CI (including Lighthouse) is green.
