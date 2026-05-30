# Project Roadmap

## Current State

The package has the core installer flow in place: multi-agent adapters, credential wrapper mode, registry-backed updates, config merge writers, package asset copy, and Vitest coverage for main behaviors.

## Near-Term Priorities

| Priority | Work | Rationale |
| --- | --- | --- |
| P0 | Align CLI Commander version with `package.json`. | Avoid confusing `kkauto-skill --version` output. |
| P0 | Clarify/fix `doctor --json` semantics. | Current output is JSON-shaped regardless of flag. |
| P1 | Stat credentials file mode in `doctor`. | `modeOk` currently does not verify actual permissions. |
| P1 | Expand doctor tests. | Current doctor test only checks registry path helper. |
| P1 | Document Antigravity legacy/manual path handling in release notes when changed. | Avoid silent writes to ambiguous legacy configs. |
| P2 | Add examples for each agent in docs. | Reduce setup friction without duplicating README. |

## Maintenance Backlog

- Keep `docs/agents.md` synced with adapter path changes.
- Keep `docs/packs.md` synced with `skills/manifest.json`.
- Add/adjust tests whenever install/update/config-writing behavior changes.
- Review token redaction when adding new diagnostics or error surfaces.
- Inspect `npm pack --dry-run` output before every publish.

## Release Readiness Gates

1. Docs match source behavior.
2. No real credentials in docs/tests/fixtures/logs.
3. Verification passes in order:

```bash
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

## Related Docs

- [Project Overview PDR](./project-overview-pdr.md)
- [Code Standards](./code-standards.md)
- [Deployment Guide](./deployment-guide.md)
