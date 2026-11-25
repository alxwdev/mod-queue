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

### 1.2 Monorepo and tooling (2026-11-24)

- Agent: created the root `package.json` (scripts from `tooling.md` without `generate`, `postinstall`, `codegen`, `dev`), `pnpm-workspace.yaml`, `tsconfig.base.json`, the ESLint flat config, the Prettier config, `.editorconfig`, `.gitattributes`, `.nvmrc`, `.env.example`; extended `.gitignore` and `.prettierignore` (`pnpm-lock.yaml`). Checked every lint rule group with a throwaway probe outside the repo.
- Review: pending.
- Deviations: TypeScript 6.0.3, not 7.0.2 (`latest`), because `typescript-eslint` 8.74 supports only `<6.1.0`; the plan asks for 5.9+. The range is `~6.0.3`, so `pnpm update` cannot move it to an unsupported 6.1. ESLint 10.15 (ESLint 9 is marked unsupported on npm) with a `peerDependencyRules` entry in `pnpm-workspace.yaml`: `eslint-plugin-jsx-a11y` 6.10.2 declares ESLint ≤ 9, but its rules use only `context.options`, `context.report` and `context.settings`, which ESLint 10 keeps.
