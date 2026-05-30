# Codebase Summary

Generated from repository analysis on 2026-05-30.

## Purpose

`kkauto-skill` installs kkAuto skill instructions and MCP config for supported AI agents. It does not run the `kkauto-mcp` server and does not call kkAuto HTTP APIs directly. Runtime MCP command is `npx -y kkauto-mcp`.

## Package Snapshot

| Item | Value |
| --- | --- |
| Package | `kkauto-skill@0.1.1` |
| Runtime | Node.js `>=20` |
| Module system | TypeScript ESM, `NodeNext` |
| CLI bin | `kkauto-skill` -> `dist/cli.js` |
| Source entry | `src/cli.ts` |
| Published files | `dist`, `docs`, `skills`, `templates`, `README.md`, `LICENSE` |

## Main Areas

| Area | Files | Responsibility |
| --- | --- | --- |
| CLI | `src/cli.ts`, `src/commands/*` | Commander commands: `install`, `update`, `doctor`, `list`, `print-config`. |
| Agents | `src/agents/*` | Agent registry, detection, skill paths, MCP config targets. |
| Core | `src/core/*` | Config merge, credentials, manifest, registry, MCP launch, redaction, backups. |
| CLI UI | `src/cli-ui/prompts.ts` | Interactive prompts for agent, credentials, Antigravity scopes, confirmation. |
| Skills | `skills/manifest.json`, `skills/**/SKILL.md` | Installable kkAuto instruction packs. |
| Templates | `templates/mcp/*` | Example MCP formats copied into `dist`. |
| Tests | `tests/*.test.ts` | Vitest coverage for install/update/config/doctor/redaction/manifest/adapters. |

## Commands

| Command | Verified options |
| --- | --- |
| `install` | `--agent`, `--packs`, `--dry-run`, `--no-mcp-config`, `--json`, `--no-interactive`, `--base-url`, `--api-token`, `--skip-credentials`, `--use-placeholders`, `--antigravity-scopes` |
| `update` | `--dry-run`, `--json`, `--use-placeholders` |
| `doctor` | `--agent`, `--json` |
| `list` | `--json` |
| `print-config` | required `--agent`, plus `--json`, `--use-placeholders` |

## Agent Support

Supported agents are defined in `src/agents/index.ts`: `claude`, `opencode`, `codex`, `antigravity`, `cursor`.

- JSON MCP agents use `mcpServers.kkauto`.
- Codex uses TOML `mcp_servers.kkauto`.
- Cursor writes project-local `.cursor/rules/kkauto-*.mdc` and `.cursor/mcp.json`.
- Antigravity writes per-pack `SKILL.md` files for workspace/global/shared scopes.
- Non-interactive `install --agent auto` fails when multiple agents are detected; pass `--agent <name>` or `--agent all`.
- Non-interactive `install --agent all` targets all supported agents, not only detected agents.

## Packs

Default packs from `skills/manifest.json`: `core`, `source-workflows`, `fb-posts`. Optional packs: `source-posts`, `source-crawlers`. `core` is always included by `resolvePacks()` even when omitted.

## State And Safety

| Concern | Current behavior |
| --- | --- |
| Credentials | Stored at `~/.config/kkauto-skill/credentials.env`; writes use chmod `0600`. |
| Default MCP launch | Bash wrapper sources `credentials.env`; real tokens are not inlined by default. |
| Placeholder mode | Explicit via `--use-placeholders`, or fallback when no usable credentials exist. |
| Registry | `~/.config/kkauto-skill/registry.json`; update replays registry installs. |
| Cursor update | Uses registered Cursor project path, not current working directory. |
| Config writes | Merge JSON/TOML, preserve unrelated settings, back up existing files before write. |
| Skill source | Packaged `skills/` preferred; `KKAUTO_SKILL_ROOT` can override. |
| Redaction | Error and doctor output pass through token redaction. |

## Known Internal Notes

- `src/cli.ts` reads Commander version from `package.json`.
- `doctor` prints JSON-shaped output regardless of `--json`; `--json` does not change format in current code.
- `doctor` credentials `modeOk` is true for any existing parseable credentials file; current code does not stat file permissions.
- Antigravity adapter can report a manual legacy MCP target when both legacy candidate files exist; install writes scope-derived targets for normal scope installs.
