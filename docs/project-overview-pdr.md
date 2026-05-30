# Project Overview PDR

## Overview

`kkauto-skill` is a Node.js CLI package that installs kkAuto agent skill instructions and MCP config for supported AI agents. It keeps `kkauto-mcp` as an external runtime (`npx -y kkauto-mcp`) and does not call kkAuto APIs itself.

## Product Goals

| Goal | Requirement |
| --- | --- |
| Fast onboarding | One CLI command installs skills and MCP config for a selected agent. |
| Multi-agent support | Support Claude Code, OpenCode, Codex CLI, Antigravity CLI, Cursor. |
| Safe credentials | Default flow stores tokens outside agent configs in `credentials.env`. |
| Repeatable updates | `update` refreshes installs from registry state. |
| Publishable package | Build copies skills/templates into `dist`; npm package includes runtime assets and docs. |

## Users

- kkAuto users configuring AI agents to use kkAuto MCP tools.
- Developers maintaining skill packs and adapter behavior.
- Release maintainers publishing the npm package.

## Functional Requirements

| ID | Requirement | Acceptance |
| --- | --- | --- |
| FR-1 | Install skill packs for supported agents. | `install --agent <name>` writes agent-specific skill targets. |
| FR-2 | Install MCP config safely. | Default MCP config uses a wrapper that sources `~/.config/kkauto-skill/credentials.env`. |
| FR-3 | Support default and optional packs. | Defaults are `core`, `source-workflows`, `fb-posts`; optional packs install by `--packs`. |
| FR-4 | Always include `core`. | `resolvePacks()` prepends `core` if omitted. |
| FR-5 | Preserve existing configs. | JSON/TOML writers merge `kkauto` server and preserve unrelated settings. |
| FR-6 | Support project-scoped Cursor installs. | Cursor rules/MCP config write under target project `.cursor/`. |
| FR-7 | Replay installs. | `update` reads registry and re-runs installs with registered packs/targets. |
| FR-8 | Diagnose setup. | `doctor` reports Node/npx, credentials, detected agents, registry installs, MCP wrapper status. |
| FR-9 | Print config without writes. | `print-config --agent <name>` renders agent MCP config. |

## Non-Functional Requirements

| Category | Requirement |
| --- | --- |
| Runtime | Node.js `>=20`. |
| Module format | TypeScript ESM with `module` and `moduleResolution` `NodeNext`. |
| Security | Never document, test, log, or inline real `KK_API_TOKEN` values. |
| Backward safety | Back up existing MCP config before merge writes. |
| Testability | Use Vitest with temp homes/projects for install/update behavior. |
| Release quality | Verify `typecheck -> test -> build -> npm pack --dry-run`. |

## Constraints

- CLI package only; no server runtime embedded.
- `kkauto-mcp` remains launched by `npx -y kkauto-mcp`.
- Agent config formats differ: JSON `mcpServers` vs Codex TOML `mcp_servers`.
- Cursor and Antigravity workspace installs are project-local.
- Pack source must prefer package assets, not arbitrary caller `cwd`.

## Success Metrics

- New user can install default packs for one agent in one command.
- No real token appears in generated agent configs by default.
- Existing MCP servers/settings survive install/update.
- CI passes in documented order.
- `npm pack --dry-run` includes `dist`, `docs`, `skills`, `templates`, `README.md`, `LICENSE`.

## Related Docs

- [Codebase Summary](./codebase-summary.md)
- [System Architecture](./system-architecture.md)
- [Code Standards](./code-standards.md)
- [Agent Support](./agents.md)
- [Security](./security.md)
