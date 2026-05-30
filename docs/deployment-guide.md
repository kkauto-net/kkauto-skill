# Deployment Guide

## Scope

This project deploys as an npm CLI package. There is no hosted service, server deploy, database migration, or web frontend.

## Build Pipeline

| Step | Command | Purpose |
| --- | --- | --- |
| Install deps | `npm install` | Match CI dependency install. |
| Typecheck | `npm run typecheck` | Verify strict TypeScript without emit. |
| Test | `npm test` | Run Vitest suite. |
| Build | `npm run build` | Compile to `dist` and copy `skills`/`templates`. |
| Pack check | `npm pack --dry-run` | Inspect published files. |

Required order after install: `typecheck -> test -> build -> pack dry run`.

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
8. Publish with npm provenance when available.
9. Verify `npx kkauto-skill@latest --help` after publish.

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
