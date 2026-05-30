# Deployment Guide

## Scope

This project deploys as an npm CLI package. There is no hosted service, server deploy, database migration, or web frontend.

## Build Pipeline

| Step | Command | Purpose |
| --- | --- | --- |
| Install deps | `npm ci` | Match CI lockfile install. |
| Typecheck | `npm run typecheck` | Verify strict TypeScript without emit. |
| Unit tests | `npm run test:unit` | Fast helper/config coverage. |
| Integration tests | `npm run test:integration` | Temp filesystem install/update coverage. |
| Security tests | `npm run test:security` | Redaction, wrapper, chmod, and CLI no-leak coverage. |
| Build | `npm run build` | Compile to `dist` and copy `skills`/`templates`. |
| E2E | `npm run test:e2e` | Run compiled CLI sandbox tests. |
| Audit | `npm run security:audit` | Fail high/critical npm advisories. |
| Pack check | `npm pack --dry-run` | Inspect published files. |

Required order after install: `typecheck -> tests -> build -> e2e -> audit -> pack dry run`.

## GitHub Workflows

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | Push and pull request | Unit/integration/E2E on Node 20/22 Ubuntu/macOS; security tests and audit on Node 20/22 Ubuntu; build-pack on Ubuntu Node 20; dependency review on PRs; final `ci-pass` aggregate. |
| `codeql.yml` | Push, pull request, weekly | JavaScript/TypeScript CodeQL analysis. |
| `nightly.yml` | Daily and manual dispatch | Full Vitest suite on Node 20/22 Ubuntu/macOS plus local tarball smoke. |
| `cleanup-artifacts.yml` | Daily and manual dispatch | Purge old GitHub Actions artifacts only; manual delete remains confirmation-gated. |

CI and nightly do not call `kkauto-mcp`, kkAuto APIs, or real agent binaries. They use temp sandboxes and do not upload generated HOME/project configs.

## Package Contents

`package.json` publishes:

- `dist`
- `docs`
- `skills`
- `templates`
- `README.md`
- `LICENSE`

## Pre-Publish Checklist

1. Confirm npm package ownership for `kkauto-skill`.
2. Confirm package version in `package.json`.
3. Confirm CLI version output is correct.
4. Run verification commands in required order.
5. Inspect `npm pack --dry-run` output for missing assets or unexpected files.
6. Confirm README, docs, tests, logs, and fixtures contain no real `KK_API_TOKEN`.
7. Confirm `package.json` has no unexpected lifecycle scripts, especially no `postinstall`.
8. Confirm `npm run security:audit` has no unresolved high/critical advisories.
9. Publish with npm provenance when available.
10. Verify `npx kkauto-skill@latest --help` after publish.

## Runtime Install Verification

Use placeholders or test credentials only:

```bash
npx kkauto-skill install --agent opencode --dry-run --use-placeholders
npx kkauto-skill print-config --agent codex --json --use-placeholders
npx kkauto-skill doctor --json
```

## Related Docs

- [Security](./security.md)
- [Code Standards](./code-standards.md)
