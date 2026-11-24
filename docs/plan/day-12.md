# Day 12: Release and documentation

**Goal:** a stable v1.0.0 in production, documented so that a newcomer understands it in two minutes.
**Complexity:** Low–Medium · **Must:** 6.75 h · **Branches:** `day-12-release` (fixes), then `day-12-docs` (README, ADRs, video link)
**Demo:** the README on GitHub with the live link, video, screenshots and numbers.
**Read first:** [conventions.md](conventions.md), [release.md](release.md), [decisions.md](decisions.md) for 12.4.

## 12.1 Bug bash and cleanup
Must · M · 1.5 h · Depends on: 11.3, 11.4, 11.5

Steps:
1. **Owner**: run the manual test matrix and the exploratory charters from [release.md](release.md) on the preview deployment. The agent turns the notes into a "Bug bash" table in `docs/quality.md`: bug, where, severity (blocks a demo flow / visible / minor), status.
2. Fix every bug that blocks a flow of the demo script, then the visible ones while time allows. Each fix gets a regression test. Bugs that are not fixed get a backlog ID in [backlog.md](backlog.md).
3. Remove leftovers (`console.log`, unused exports, stray TODOs); `pnpm dedupe`; `pnpm audit --prod` (fix high and critical issues or write down why not).

Files: `docs/quality.md`, `docs/plan/backlog.md` (modify); source and test files for the fixes.
Tests: one regression test per fixed bug.
Done when: every row of the manual matrix is checked; no open bug blocks a demo flow; `pnpm audit --prod` shows no high or critical issue without a recorded reason; CI is green.

## 12.2 Production release
Must · S · 1 h · Depends on: 12.1

Steps:
1. **Owner**: merge the `day-12-release` pull request. The Vercel production build runs the migrations in its build command.
2. Trigger the reset cron once by hand for fresh data.
3. Go through the production smoke checklist in [release.md](release.md).
4. Sentry shows no new errors and Web Vitals arrive.
5. Run Lighthouse against the production URL (desktop and mobile) and record the numbers in `docs/quality.md`.

Files: `docs/quality.md` (modify, on the `day-12-docs` branch).
Tests: none (the smoke checklist is the check).
Done when: every line of the production smoke checklist is ticked and the production Lighthouse numbers are recorded.

## 12.3 README, diagram, screenshots
Must · M · 1.75 h · Depends on: 12.2

Steps:
1. `e2e/screenshots.ts` (run with `pnpm screenshots`): saves deterministic screenshots to `docs/images/` (queue on desktop, tablet slide-over, phone item view, remove dialog, mod log, health). **Owner**: record a short GIF of keyboard triage with ScreenToGif (≤ 5 MB).
2. `docs/architecture.md`: the system overview diagram and the optimistic flow diagram from the plan, with a short data-flow description.
3. README sections:
   1. Name, one-line pitch, links: **Live demo**, **2-minute video**, `docs/plan/`.
   2. Hero GIF.
   3. Why this project (one paragraph: a data-heavy internal tool, keyboard-first).
   4. Features + keyboard shortcuts table.
   5. Quality numbers (Lighthouse, axe, INP, LCP, CLS, coverage) and how each is measured.
   6. Architecture: the mermaid system overview + a link to `docs/architecture.md`.
   7. Tech stack with one-line reasons; key decisions with links to the ADRs.
   8. State management (why no Redux).
   9. Accessibility and performance notes.
   10. Testing strategy and coverage.
   11. Run locally (Docker, `pnpm i`, `pnpm db:up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`).
   12. Project structure; deployment.
   13. How I built this with AI agents (written in task 12.4).
   14. Limitations and next steps (from the Nice backlog); license.

Files: `apps/web/e2e/screenshots.ts`, `docs/architecture.md`, `docs/images/*` (new); `README.md`, `apps/web/package.json`, `package.json` (modify).
Tests: none; `pnpm screenshots` must run without errors.
Done when: the README renders on GitHub with working images and the mermaid diagram; every number in the quality section comes from `docs/quality.md`; every link works except the video link (added in 12.5).

## 12.4 ADRs and the AI section
Must · S · 1 h · Depends on: —

Steps:
1. Write ADRs 0001–0010 from [decisions.md](decisions.md) (context, decision, consequences; max one page each), using `docs/adr/0000-template.md`.
2. README section "How I built this with AI agents" (about 250 words, linking `docs/plan/` and `docs/ai-log.md`): the workflow (plan → one task per session → tests → review → manual check), what was delegated and what was done by hand, guardrails (repo `CLAUDE.md`, typed codegen, CI gates), 2–3 real examples where review caught an agent mistake (taken from `docs/ai-log.md`), and simple numbers (days, tasks, tests).

Files: `docs/adr/0001-*.md` … `docs/adr/0010-*.md` (new); `README.md` (modify).
Tests: none (documents only).
Done when: ten ADR files exist and are linked from the README; the AI section quotes only examples that are in `docs/ai-log.md`.

## 12.5 Two-minute video
Must · M · 1.5 h · Depends on: 12.2

Script in `docs/demo-script.md` (written by the agent, recorded by the **Owner**):

| Time | Scene |
|---|---|
| 0:00–0:15 | Problem: 500 reports, a mouse-driven tool is slow. |
| 0:15–1:00 | Keyboard triage: `j/k`, approve, undo, remove with a template, bulk, the help dialog; a keystroke overlay is on. |
| 1:00–1:20 | Tablet slide-over and the phone flow. |
| 1:20–1:40 | Mod log search, queue health charts. |
| 1:40–2:00 | Quality: tests, Lighthouse, axe, the architecture diagram, the AI workflow. |

Record at 1920×1080 with OBS and Carnac (keystroke overlay on Windows); add captions; upload as an unlisted YouTube video or to Loom; link it from the README with a thumbnail.

Files: `docs/demo-script.md`, `docs/images/video-thumbnail.png` (new); `README.md` (modify).
Tests: none.
Done when: the video link in the README opens the video; the video is at most 2 minutes 15 seconds long and has captions.

## End of the day

**Owner**: merge the `day-12-docs` pull request; check that every README link works on GitHub; tag `v1.0.0` on `main` and push the tag.
