---
type: journal
created: 2026-05-31
scope: implementation
---

# Enterprise Heavy Test CI Implementation

## Context

Implemented `plans/260531-0039-enterprise-heavy-test-ci-matrix/plan.md` after user approved the heavy matrix direction.

## What Happened

- Added granular npm scripts for unit, integration, security, E2E, CI aggregate, nightly, and audit checks.
- Expanded security tests for credential file mode, no-inline wrapper configs, CLI no-leak behavior, multi-line credential rejection, and literal shell metacharacter handling.
- Replaced the default wrapper's shell `source` behavior with literal whitelist parsing of `credentials.env` keys.
- Reworked `ci.yml` into separate matrix jobs and a final `ci-pass` aggregate.
- Added `codeql.yml` and `nightly.yml` with tarball smoke coverage.
- Updated docs and plan status to match implemented behavior.

## Decisions

- Keep E2E sandbox-only; no `kkauto-mcp`, kkAuto API calls, or real agent launches.
- Keep Windows outside required matrix because wrapper mode is POSIX/bash-based.
- Require dependency review only on pull requests, but include it in `ci-pass` for PR branch protection.

## Verification

- `npm run typecheck`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:security`
- `npm run build`
- `npm run test:e2e`
- `npm run test:ci`
- `npm run test:nightly`
- `npm run security:audit`
- `npm pack --dry-run`
- `git diff --check`

All passed locally after the parser consistency fix.

## Next

- Monitor PR CI runtime and move noisy matrix legs to nightly if needed.
- Branch protection should require `ci pass` after workflows land.
- Separate hygiene remains for older install-matrix plan status.
