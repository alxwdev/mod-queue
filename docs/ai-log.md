# AI log

A record of the work that AI coding agents do in this repo: one entry per task, newest last.
The agent writes the entry before it reports. The owner fills in what the review changed.

## Entry format

```text
### <task ID> <task title> (<YYYY-MM-DD>)

- Agent: what the agent did.
- Review: what the owner's review changed, or "No changes".
- Deviations: differences from the plan and why, or "None".
```

## Entries

### 1.1 Repository bootstrap (2026-11-24)

- Agent: created `CLAUDE.md` (project summary, working rules, root commands, short conventions) and this log. Owner steps 1–2 were already done: the branch is `main` and `docs/plan/` is committed.
- Review: added `docs/plan/` to `.prettierignore`, because the plan files do not follow Prettier style and stay as written. The file is created here, ahead of task 1.2, which extends it.
- Deviations: the repo already has commits and a GitHub remote (`origin`, `main` is pushed). The plan expects no remote before task 2.3; task 2.3 starts from the existing repository.
