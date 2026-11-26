# Owner's workflow for the plan tasks

These rules add to `CLAUDE.md` and `docs/plan/README.md`.

## Commits

- When the owner says "коміть" (commit) for a task, the owner has reviewed the task and approves it as it is.
- Before that commit, set the task's `- Review:` line in `docs/ai-log.md` to `approved, no changes.`. If the owner changed something in review, list the changes instead.
- Put the Review line in the same commit as the task. Review lines of earlier tasks that the owner changed but did not commit go into the same commit too.

## AI log

- Write a note for a later task in the `Deviations` of the current task's entry in `docs/ai-log.md`.
- Do not create a separate notes file for it, and do not change `docs/plan/` for it.
- Reason: the agent of the later task finds a problem that fails loudly (an error or a failing check) by itself, so the log is enough.
- If a problem would fail silently in the later task, tell the owner. The owner decides where the note goes.
