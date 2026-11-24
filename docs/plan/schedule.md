# Schedule

## Twelve days at a glance

| Day | Stage | Must (h) | Complexity | Main result |
|---|---|---|---|---|
| 1 | Foundation: repo rules, monorepo, tooling, DB, Jest for packages, seed | 6.5 | Medium | `pnpm check` green locally; 10,500 visible queue items seeded |
| 2 | Test tooling, CI, API core, design tokens | 6.5 | Medium | CI green on GitHub; `me` answers at `/api/graphql`; palette approved |
| 3 | GraphQL API: queue, moderation, undo, reasons, mod log, health | 7 | High | Complete, tested API |
| 4 | Design system, Apollo Client, app shell | 6.75 | Medium | Responsive shell built from our own UI kit |
| 5 | Deployment and monitoring; queue data and virtual list | 6.25 | High | Live URL; Sentry receives errors; scroll through 10,000+ items |
| 6 | Filters, preview, responsive sheets; queue reducer and cache helpers | 5.75 | High | Browse with filters on three layouts |
| 7 | Actions: optimistic approve, undo, rollback, conflicts; shortcut base | 6.5 | High | Approve with instant UI and undo; errors roll back |
| 8 | Keyboard model and focus management | 6 | Very high | Whole queue usable without a mouse |
| 9 | Remove/ban form, removal reasons screen | 6.5 | Medium | Remove and ban with templates and live preview |
| 10 | Mod log and queue health UI; E2E start | 7 | Medium–High | All four screens complete; keyboard triage proven in a real browser |
| 11 | E2E on tablet and phone, performance, Lighthouse CI, accessibility audit | 6.5 | High | Quality goals measured and enforced in CI |
| 12 | Bug bash, production release, README, ADRs, video | 6.75 | Low–Medium | v1.0.0 live and documented |
| | **Total** | **78 h + 18 h buffer** | | |
| 13–14 | Reserve | — | — | See below |

Each day has about 8 focused hours. The planned Must work is at most 7 h; the rest of the day is buffer for that day's tasks.

### Reserve days (13–14)

Use them in this order:

1. Must tasks that did not fit into Days 1–12.
2. Bugs from the bug bash and the manual matrix ([release.md](release.md)) that were deferred.
3. Nice-to-have items in the order of [backlog.md](backlog.md).

If the plan is more than one day late after Day 8, apply the cut line in [risks.md](risks.md) instead of counting on the reserve days.

### What changed in the 2026-11-13 revision

The first version planned 10 days. These estimates were raised: test tooling 1 h → 2.5 h (three tasks: 1.5, 2.1, 2.2); UI kit 2.75 h → 4.5 h (two tasks: 4.1, 4.2); deployment 1.75 h → 2.5 h; E2E specs 2.75 h → 4.5 h (three tasks: 10.5, 11.1, 11.2); moderation and undo 2 h → 2.5 h; roving focus and focus rules 3.25 h → 4 h; `useModeration` 2 h → 2.5 h (its tests moved into the task). The mod log and health APIs moved to Day 3, so the whole API is finished in one stage.

## Task dependencies

```mermaid
flowchart TD
  T11[1.1 Repo bootstrap] --> T12[1.2 Monorepo]
  T12 --> T13[1.3 Next app]
  T12 --> T14[1.4 Postgres + Prisma]
  T14 --> T15[1.5 Jest for packages]
  T15 --> T16[1.6 Seed]
  T13 --> T21[2.1 Web test tooling]
  T21 --> T22[2.2 Playwright]
  T16 --> T22
  T22 --> T23[2.3 CI + docs]
  T15 --> T24[2.4 SDL + codegen] --> T25[2.5 Server core]
  T13 --> T25
  T13 --> T26[2.6 Tokens]
  T25 --> T31[3.1 Queue reads] --> T32[3.2 Moderation + undo] --> T34[3.4 Mod log API]
  T16 --> T31
  T25 --> T33[3.3 Reasons CRUD]
  T25 --> T35[3.5 Health API]
  T26 --> T41[4.1 UI kit: controls] --> T42[4.2 UI kit: overlays]
  T21 --> T41
  T24 --> T43[4.3 Apollo Client]
  T42 --> T44[4.4 App shell]
  T43 --> T44
  T25 --> T44
  T44 --> T51[5.1 Deploy + Sentry]
  T23 --> T51
  T21 --> T52[5.2 URL state] --> T53[5.3 useQueue]
  T43 --> T53
  T31 --> T53
  T53 --> T54[5.4 Virtual list]
  T41 --> T54
  T54 --> T61[6.1 Filters]
  T42 --> T61
  T54 --> T62[6.2 Preview + sheets]
  T42 --> T62
  T54 --> T63[6.3 Reducer]
  T53 --> T64[6.4 Cache helpers]
  T64 --> T71[7.1 useModeration]
  T32 --> T71
  T63 --> T72[7.2 Action/bulk bars]
  T71 --> T72
  T62 --> T72
  T72 --> T73[7.3 Action flow tests]
  T44 --> T74[7.4 useHotkeys] --> T75[7.5 Help dialog + setting]
  T74 --> T81[8.1 Roving focus]
  T63 --> T81
  T81 --> T82[8.2 Focus rules]
  T72 --> T82
  T81 --> T83[8.3 Bulk by keyboard]
  T72 --> T83
  T82 --> T84[8.4 Keyboard tests]
  T83 --> T84
  T75 --> T84
  T32 --> T91[9.1 Form schema] --> T92[9.2 Moderation dialog]
  T82 --> T92
  T33 --> T92
  T33 --> T93[9.3 Reasons screen]
  T42 --> T93
  T92 --> T94[9.4 Responsive + focus-order checks]
  T93 --> T94
  T34 --> T101[10.1 Mod log UI]
  T52 --> T101
  T35 --> T102[10.2 Health UI] --> T103[10.3 Nav badge]
  T64 --> T103
  T22 --> T104[10.4 E2E fixtures]
  T104 --> T105[10.5 E2E keyboard + filters]
  T92 --> T105
  T84 --> T105
  T101 --> T105
  T104 --> T111[11.1 E2E tablet + phone]
  T92 --> T111
  T104 --> T112[11.2 E2E screens, conflict, bulk perf]
  T101 --> T112
  T102 --> T112
  T93 --> T112
  T105 --> T113[11.3 Performance + LHCI]
  T112 --> T113
  T112 --> T114[11.4 Coverage gate]
  T105 --> T115[11.5 A11y audit]
  T111 --> T115
  T113 --> T121[12.1 Bug bash]
  T114 --> T121
  T115 --> T121
  T121 --> T122[12.2 Production release] --> T123[12.3 README]
  T122 --> T125[12.5 Video]
  T124[12.4 ADRs + AI section]
```

## Critical path and parallel work

**Critical path:** 1.1 → 1.2 → 1.4 → 1.5 → 2.4 → 2.5 → 3.1 → 5.3 → 5.4 → 6.3 → 7.2 (with 6.4 → 7.1 → 7.2 beside it) → 8.2 → 9.2 → 10.5 → 11.3 → 12.1 → 12.2 → 12.3. A delay on any of these tasks moves the release.

**Off the critical path** (good buffer fillers, or work for a second agent in a separate worktree): 9.3 Removal reasons screen (needs only 3.3, 4.2 and 4.3), 10.1–10.2 Mod log and Health UI (need only Day 3–5 work), 7.5 Shortcut help dialog, 12.4 ADRs.
