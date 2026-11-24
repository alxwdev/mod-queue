# Final testing, deployment and release checklists

## Automated (must be green on `main` before the release)

- [ ] `quality` job: format, lint, typecheck, unit + integration tests with coverage thresholds.
- [ ] `e2e` job: all Playwright projects (desktop, tablet, phone) + Lighthouse CI.
- [ ] The Vercel preview of the release pull request builds and works.

## Manual test matrix (task 12.1, on the preview)

| Environment | Checks |
|---|---|
| Chrome / Edge on Windows (desktop) | Full keyboard triage; all four screens; the "Throw test error" button is not reachable in production |
| Firefox (desktop) | Keyboard triage; dialogs; date inputs in the mod log |
| Safari / WebKit (`playwright --project` with WebKit once, or a real Mac) | Layout, sheets, toasts |
| Real phone (iOS Safari or Android Chrome) | Tap flow, bottom bar, Back closes the item, dialog with the on-screen keyboard |
| Tablet width (DevTools 768–1023 px) with a keyboard | Sheet + shortcuts inside it |
| NVDA + Chrome | Rows, toasts, dialogs, live announcements |

Exploratory charters (30 min total): fast `j` + `a` mashing; undo after switching the moderator; filters that leave the queue empty; network offline during a bulk action; two tabs as different moderators; leave the queue open for an hour and reload (time-released items appear, counts stay consistent).

## Production smoke checklist (task 12.2)

- [ ] Environment variables set for Production and Preview ([tooling.md](tooling.md)); `E2E_TEST_ROUTES` is **not** set.
- [ ] Migrations applied; data seeded; the cron job is listed in Vercel → Cron Jobs.
- [ ] `/api/test/reset` → 404; `/dev/ui` → 404; the cron route without the secret → 401.
- [ ] Security headers present (`curl -I` on the production URL).
- [ ] Sentry: source maps resolve; the environment is `production`; Web Vitals arrive.
- [ ] Lighthouse on production (desktop and mobile) recorded in `docs/quality.md`.

## After the documentation pull request (end of Day 12)

- [ ] README links (demo, video, docs) all work on GitHub.
- [ ] The tag `v1.0.0` is on `main` and pushed.
