# Project Roadmap

## Current State

The package has the core installer flow in place: multi-agent adapters, credential wrapper mode, registry-backed updates, config merge writers, package asset copy, granular Vitest scripts, heavy CI matrix, CodeQL, dependency review, audit gate, nightly verification, and artifact cleanup.

## Near-Term Priorities

| Priority | Work | Rationale |
| --- | --- | --- |
| P0 | Clarify/fix `doctor --json` semantics. | Current output is JSON-shaped regardless of flag. |
| P1 | Stat credentials file mode in `doctor`. | `modeOk` currently does not verify actual permissions. |
| P1 | Expand doctor tests. | Current doctor test only checks registry path helper. |
| P1 | Monitor heavy CI runtime after adoption. | Move noisy or slow matrix legs to nightly if PR feedback becomes too slow. |
| P1 | Document Antigravity legacy/manual path handling in release notes when changed. | Avoid silent writes to ambiguous legacy configs. |
| P2 | Add examples for each agent in docs. | Reduce setup friction without duplicating README. |

## Maintenance Backlog

- Keep `docs/agents.md` synced with adapter path changes.
- Keep `docs/packs.md` synced with `skills/manifest.json`.
- Add/adjust tests whenever install/update/config-writing behavior changes.
- Review token redaction when adding new diagnostics or error surfaces.
- Keep granular npm test scripts synced with `tests/*.test.ts` file moves.
- Keep CI, CodeQL, nightly, and cleanup-artifacts docs synced with workflow changes.
- Inspect `npm pack --dry-run` output before every publish.

## Release Readiness Gates

1. Docs match source behavior.
2. No real credentials in docs/tests/fixtures/logs.
3. Verification passes in order:

```bash
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:security
npm run build
npm run test:e2e
npm run security:audit
npm pack --dry-run
```

## Related Docs

- [Project Overview PDR](./project-overview-pdr.md)
- [Code Standards](./code-standards.md)
- [Deployment Guide](./deployment-guide.md)
