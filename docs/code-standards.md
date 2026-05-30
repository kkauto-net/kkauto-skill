# Code Standards

## Scope

Standards for this TypeScript CLI package. Docs reflect current code; update tests when behavior changes.

## Stack

| Area | Standard |
| --- | --- |
| Runtime | Node.js `>=20` |
| Language | TypeScript, strict mode |
| Module system | ESM, `NodeNext` imports with `.js` extensions in source imports |
| CLI framework | `commander` |
| Prompts | `@clack/prompts` |
| Config formats | JSON and TOML via `@iarna/toml` |
| Tests | Vitest |

## Directory Roles

| Path | Role |
| --- | --- |
| `src/cli.ts` | CLI command registration and redacted top-level error handling. |
| `src/commands/*` | Command implementations and command-specific flows. |
| `src/agents/*` | Agent adapters: detection, skill targets, MCP config targets/rendering. |
| `src/core/*` | Shared config writing, credentials, registry, manifest, templates, redaction, file utils. |
| `src/cli-ui/*` | Interactive prompt UI. |
| `skills/` | Installable skill packs and manifest. |
| `templates/` | Packaged MCP config examples. |
| `tests/` | Vitest coverage for CLI behavior and core helpers. |
| `docs/` | Evergreen docs. |

## Coding Rules

- Prefer updating existing command/core/agent modules before adding new abstractions.
- Keep adapters small: path logic, detection, render target only.
- Keep side effects in command/core functions; use temp dirs in tests.
- Preserve unrelated user config fields during writes.
- Use explicit `AgentName` / adapter types for agent-specific behavior.
- Use `redact()` for user-visible errors that may include config or env content.
- Do not write real tokens into docs, tests, fixtures, logs, or snapshots.

## Config Writer Rules

| Format | Rule |
| --- | --- |
| JSON | Merge under `mcpServers.kkauto`; preserve other top-level fields and servers. |
| TOML | Merge under `mcp_servers.kkauto`; preserve unrelated settings. |
| Wrapper mode | Server object contains `command` and `args`; no inline env. |
| Placeholder mode | Placeholder env may be written; existing env values are preserved by merge. |
| Existing files | Create backup before non-dry-run write. |

## Credential Rules

- Default credentials path: `~/.config/kkauto-skill/credentials.env`.
- Write credentials with chmod `0600`.
- Required keys: `KK_API_BASE_URL`, `KK_API_TOKEN`.
- Optional keys currently serialized: `KK_MCP_ENABLE_DELETE`, `KK_MCP_DEFAULT_STATUS`, `KK_MCP_MAX_LIST_LIMIT`.
- Use placeholders only when explicit (`--use-placeholders`) or when no usable credentials exist.

## Test Standards

- Add/update Vitest coverage for install/update/config-writing behavior changes.
- Use `mkdtemp()` home/project fixtures; avoid touching real user config.
- Test taxonomy:

| Script | Scope |
| --- | --- |
| `npm run test:unit` | Pure helpers and render/config output tests. |
| `npm run test:integration` | Direct command/core flows using temp home/project fixtures. |
| `npm run test:security` | Redaction, wrapper/no-inline-token, credential mode, and CLI no-leak checks. |
| `npm run test:e2e` | Compiled `dist/cli.js` sandbox smoke through child processes. |
| `npm run test:ci` | Deterministic local PR-suite wrapper. |
| `npm run test:nightly` | Full Vitest suite used by nightly workflow. |

- `tests/cli.test.ts` builds `dist` in `beforeAll`; run `npm run build` first in CI for clearer failures.
- Security and E2E tests must scrub `KK_*` env values and use fake sentinels only.
- For substantial changes, verify in order:

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

## Docs Standards

- Keep evergreen docs in `docs/` with kebab-case filenames.
- Document verified behavior only; reference source files when needed.
- Keep examples token-safe: placeholders only, never real credentials.
- Cross-link related docs to avoid duplicate divergent instructions.

## Related Docs

- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)
- [Security](./security.md)
- [Deployment Guide](./deployment-guide.md)
