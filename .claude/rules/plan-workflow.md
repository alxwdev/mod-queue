# Owner's workflow for the plan tasks

These rules add to `CLAUDE.md` and `docs/plan/README.md`.

## Commits

- When the owner says "коміть" (commit) for a task, the owner has reviewed the task and approves it as it is.
- Before that commit, set the task's `- Review:` line in `docs/ai-log.md` to `approved, no changes.`. If the owner changed something in review, list the changes instead.
- Put the Review line in the same commit as the task. Review lines of earlier tasks that the owner changed but did not commit go into the same commit too.

## Notes for later tasks

- Write a note for a later task in `.claude/NOTES.md`, under a heading with that task's ID (`## 4.4`). Add `(from <current task ID>)` at the end of the note.
- A note that applies to no single task goes under `## General tips`, the first group.
- If the group exists, add the note to it. Keep the task groups in task order.
- Do not delete notes, also after their task is done.
- `docs/ai-log.md` only records the work. Do not write notes for later tasks there, and do not change `docs/plan/` for them.
