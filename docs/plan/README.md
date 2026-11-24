# ModQueue: Implementation Plan

Prepared 2026-11-12, revised 2026-11-13.
Timebox: **12 working days + 2 reserve days**.
In the project repo this folder lives at `docs/plan/` (copied in task 1.1). All code paths in the plan are relative to the repo root.

## Files

| File | Content | Read it |
|---|---|---|
| [README.md](README.md) | This index, how to use the plan, git workflow | every session |
| [conventions.md](conventions.md) | Code conventions, Definition of Done | every session |
| [scope.md](scope.md) | Product, priorities, assumptions, owner prerequisites | once |
| [architecture.md](architecture.md) | System overview, layers, routes, state, keyboard model, focus rules, responsive layout, optimistic flow | UI tasks |
| [api.md](api.md) | Prisma schema, GraphQL SDL, business rules | API tasks and tasks that write GraphQL documents |
| [design.md](design.md) | Visual design brief: token values, typography, density, component look | UI tasks |
| [structure.md](structure.md) | Directory and file structure | when a task creates files |
| [decisions.md](decisions.md) | Technical decisions (the future ADRs) | when a task touches a decision |
| [tooling.md](tooling.md) | Versions, root scripts, environment variables | setup, CI and deployment tasks |
| [schedule.md](schedule.md) | 12 days at a glance, dependencies, critical path, reserve days | planning |
| `day-01.md` … `day-12.md` | The tasks of each day | the day of your task |
| [backlog.md](backlog.md) | Nice-to-have items N1–N15 | only when a day is finished early |
| [testing.md](testing.md) | Testing strategy and quality gates | test tasks |
| [release.md](release.md) | Release checklists | Days 11–12 |
| [risks.md](risks.md) | Risks, mitigations, cut line | when behind schedule |

Task IDs are `<day>.<number>`: task 4.3 is the third task in [day-04.md](day-04.md). Nice-to-have items are N1–N15.

## How to use this plan

**For the owner**

- Before Day 1, go through the prerequisites in [scope.md](scope.md).
- Give the agent one task at a time: "Implement task 5.4 from docs/plan/day-05.md". Review the diff, run the app, commit, then go to the next task.
- Steps marked **Owner** need you: accounts (GitHub, Vercel, Neon, Sentry), git operations, design approval, manual checks. The agent prepares everything else and tells you what to click.

**For the AI coding agent**

1. At the start of each session read this file, [conventions.md](conventions.md) and the day file of your task. Each day file has a "Read first" line with the reference files its tasks need: read those too. Do not read the whole plan.
2. Do exactly one task. Do not start the next one. Do not add features that the task does not list.
3. Check "Depends on". If a dependency is missing, stop and report it.
4. Use the file paths and names exactly as written in the task and in [structure.md](structure.md). If you must deviate (for example, a library API changed), pick the closest option, write it down in `docs/ai-log.md` and say so in your final message.
5. Write the tests listed in the task in the same session. Run `pnpm check` before you report (and `pnpm test:e2e` when the task touches E2E).
6. A task is finished only when its "Done when" line is true and the Definition of Done in [conventions.md](conventions.md) is met.
7. End with: changed files, test results, deviations, and anything the owner must do.
8. Never commit, push, merge, create branches or delete files without the owner's explicit approval. Propose the commit message: one commit per task, Conventional Commits (`feat(queue): virtualized list`).

## Git workflow

| Rule | Detail |
|---|---|
| Default branch | `main`. The repo starts on `master` without commits; task 1.1 renames the branch. |
| Day 1 | Committed directly to `main`: there is no remote yet and nothing to compare with. |
| Remote | The GitHub repo is created in task 2.3. |
| From Day 2 | One branch per day, created from the up-to-date `main`. The name is in the day file (`day-05-deploy-queue-list`). One commit per task, after the owner's review. |
| End of the day | Push the branch, open the pull request "Day N: title". Merge it with a merge commit (it keeps one commit per task) when the day's Definition of Done is met: CI is green and, from Day 5 on, the Vercel preview works. |
| Production | From Day 5, Vercel deploys `main` to production. Production therefore always shows the last finished day. |
| Release | Day 12: the last pull requests are merged, production is checked, then the owner tags `v1.0.0` (tasks 12.2–12.5). |
| A day that is not finished | The pull request stays open. Unfinished Must tasks move to the next morning and use that day's buffer, then the reserve days ([schedule.md](schedule.md)). |
