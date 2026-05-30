# Design Guidelines

## Scope

This is a CLI/docs package. Design guidance focuses on terminal UX, docs clarity, and safe output.

## CLI UX

- Default to safe credential handling; never surprise users with inline real tokens.
- Make destructive or broad writes visible before execution when interactive.
- Prefer explicit flags for automation: `--agent`, `--no-interactive`, `--json`, `--dry-run`.
- Keep errors actionable: name unsupported agents, suggest valid selectors, redact secrets.
- Preserve existing user config and report merge results concisely.

## Docs UX

- Lead with commands and paths, not background.
- Use tables for agent paths, flags, pack names, and release steps.
- Keep examples copy-pasteable but token-safe.
- Link to source-of-truth docs instead of duplicating long sections.

## Output Safety

- Use placeholder values in docs: `https://your-tenant.example.com`, `paste-token-here`.
- Do not include screenshots/logs with real `KK_API_TOKEN`.
- Prefer `--dry-run` examples for install previews.

## Related Docs

- [Security](./security.md)
- [Agent Support](./agents.md)
- [Deployment Guide](./deployment-guide.md)
