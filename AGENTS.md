# AGENTS.md

## Scope

- This package installs kkAuto skill packs and MCP config for supported agents. It does not run the `kkauto-mcp` server or call kkAuto APIs directly.

## Stack And Entry Points

- Runtime: Node.js `>=20`.
- Language/tooling: TypeScript ESM (`module`/`moduleResolution` = `NodeNext`).
- CLI entrypoint: `src/cli.ts` -> `dist/cli.js`.
- Main command implementations live in `src/commands/*`.
- Agent-specific path/config logic lives in `src/agents/*`.
- Installable content comes from `skills/manifest.json` and `skills/**/SKILL.md`.

## Required Verification Order

- CI runs: `npm run typecheck` -> granular tests -> `npm run build`/E2E -> audit/dependency review -> `npm pack --dry-run`.
- Local substantial-change verification should match that order:
  - `npm run typecheck`
  - `npm run test:unit`
  - `npm run test:integration`
  - `npm run test:security`
  - `npm run build`
  - `npm run test:e2e`
  - `npm run security:audit`
  - `npm pack --dry-run`

## Core Commands

- Install deps: `npm ci` in CI, `npm install` for local dependency updates
- Typecheck: `npm run typecheck`
- Tests: `npm test`
- Unit tests: `npm run test:unit`
- Integration tests: `npm run test:integration`
- Security tests: `npm run test:security`
- Compiled CLI sandbox E2E: `npm run build && npm run test:e2e`
- Security audit: `npm run security:audit`
- Build: `npm run build`
- Package contents check: `npm pack --dry-run`
- CLI smoke examples:
  - `npx kkauto-skill install`
  - `npx kkauto-skill update`
  - `npx kkauto-skill doctor --json`
  - `npx kkauto-skill print-config --agent opencode`

## Repo-Specific Behavior

- `core` is always included even if omitted from `--packs`; this is enforced in `src/core/manifest.ts`.
- `install --agent auto` only succeeds when exactly one supported agent is detected. If multiple are detected, use `--agent <name>` or `--agent all`.
- `update` replays installs from `~/.config/kkauto-skill/registry.json`, not from the current working tree state.
- Cursor installs are project-local and keyed by target path. `update` intentionally uses the registered project path, not the current `cwd`.
- Config writers merge existing JSON/TOML and preserve unrelated MCP servers/settings instead of overwriting whole files.
- Cursor rule generation removes stale `kkauto-*.mdc` files but preserves unrelated user rules.
- Skill source resolution prefers the packaged `skills/` directory; tests assert it should not silently load `./skills` from an arbitrary caller `cwd`.

## Secrets And Safety

- Default install stores credentials in `~/.config/kkauto-skill/credentials.env` with mode `600`.
- Default MCP config uses a wrapper that reads `credentials.env`; do not inline real tokens into generated agent config unless explicitly testing placeholder mode.
- `--use-placeholders` is legacy/explicit behavior for inline placeholder env blocks.
- Never paste real `KK_API_TOKEN` values into docs, tests, fixtures, logs, or screenshots.
- Error/doctor paths redact token-like values; keep that behavior intact when editing output code.

## Files Worth Checking Before Risky Changes

- `README.md`
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/nightly.yml`
- `.github/workflows/cleanup-artifacts.yml`
- `docs/agents.md`
- `docs/security.md`
- `docs/deployment-guide.md`
- `docs/code-standards.md`
- `tests/install.test.ts`
- `tests/update.test.ts`
- `tests/cli.test.ts`
- `tests/mcp-wrapper.test.ts`
- `tests/redaction.test.ts`
- `tests/manifest.test.ts`

## Change Guidance

- Prefer updating existing command/core modules over adding new abstractions.
- If you change install/update/config-writing behavior, add or update Vitest coverage in `tests/*.test.ts`.
- If you change published assets or pack layout, verify `npm pack --dry-run` output before finishing.
