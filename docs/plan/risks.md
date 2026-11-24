# Risks, mitigations and cut line

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Focus management with virtualization is harder than planned | High | High | A whole day (Day 8) with 2 h of buffer; the shortcut base is done the day before; the next active item is decided by a pure reducer with table tests; one `focusRow` helper with retries; the rules table in [architecture.md](architecture.md) is the spec. |
| Apollo optimistic updates + pagination cache bugs | Medium | High | All cache writes live in `queue-cache.ts`, tested against a real `InMemoryCache`; one cache write per action; undo works from snapshots, not from the cache. |
| Library API changes (Next 16, Apollo Client 4, Prisma 7, Zod 4, Tailwind 4) | Medium | Medium | Version table ([tooling.md](tooling.md)); the agent checks current docs and records deviations; versions pinned by the lockfile. |
| Test tooling setup problems (Jest + generated Prisma client, MSW 2 + jsdom) | Medium | Medium | Three separate tooling tasks (1.5, 2.1, 2.2) with 2.5 h in total; `jest-fixed-jsdom` and the mocks listed in task 2.1 from the start. |
| Serverless + database connections (Neon) | Low | Medium | Pooled URL at runtime, direct URL for migrations, a lazy singleton client, same region. |
| Flaky CI (Lighthouse noise, E2E timing) | Medium | Medium | Median of 3 runs; web-first assertions only (no fixed sleeps); 1 retry with trace; the fallback rules in task 11.3. |
| Public demo data emptied or messed up by visitors | Medium | Low | Daily reset cron; 200-item bulk cap; 10,500 items in the queue; time-released reports refill it during the day. |
| Time overrun | Medium | High | In-day buffer (18 h in total); two reserve days; the critical path in [schedule.md](schedule.md); the cut line below; Nice items only when ahead. |
| The owner's design review changes the palette late | Low | Medium | The review happens on Day 2, before any component exists; components use token names only, so a later change touches `globals.css` and [design.md](design.md) only. |
| Windows-specific problems (line endings, env in scripts, file name case) | Medium | Low | `.gitattributes`, `cross-env`, kebab-case file names. |

## Cut line (when behind schedule)

First drop everything in [backlog.md](backlog.md) that has not been started. Then use the reserve days. If the plan is more than one day late after Day 8, reduce Must scope in this order:

1. Mod log on phone: a horizontally scrollable table instead of cards (WCAG 1.4.10 allows it for data tables).
2. Removal reasons: drop archive and "Show archived" (keep create and edit).
3. Tablet: reuse the phone full-screen sheet instead of the right-side slide-over.
4. ADRs: write 0002, 0004, 0006 and 0007 only; the other six stay as rows in [decisions.md](decisions.md).
5. Video: a 60-second GIF with captions now; record the video after the release.

**Never cut:** the keyboard model and focus rules, optimistic actions with undo and rollback, bulk actions, the remove/ban form, the keyboard E2E flow, CI, deployment, and the README.
