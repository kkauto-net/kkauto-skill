# Codebase Summary

Generated from repository analysis on 2026-05-29.

## Purpose

`kkauto-skill` installs kkAuto skill instructions and MCP config snippets for supported AI agents. It does not implement the `kkauto-mcp` runtime or call kkAuto HTTP APIs directly.

## Main Areas

| Area | Files | Responsibility |
|---|---|---|
| CLI | `src/cli.ts`, `src/commands/*` | Commander commands: install, update, doctor, list, print-config. |
| Agents | `src/agents/*` | Adapter registry, detection, target paths, MCP config rendering. |
| Core | `src/core/*` | File writes, config merging, manifest loading, registry, redaction. |
| Skills | `skills/**/SKILL.md`, `skills/manifest.json` | Installable instruction packs and default pack metadata. |
| Templates | `templates/mcp/*` | Example MCP config formats per agent. |
| Docs | `README.md`, `docs/*.md` | User-facing install, agent, security, release, and pack docs. |
| Tests | `tests/*.test.ts` | Vitest coverage for adapters, config writing, CLI behavior, installs, updates. |

## Current Agent Support

Supported agents are defined in `src/agents/index.ts`: `claude`, `opencode`, `codex`, `antigravity`, and `cursor`.

- JSON MCP agents render `mcpServers.kkauto` with `npx -y kkauto-mcp`.
- Codex renders TOML `[mcp_servers.kkauto]`.
- Cursor writes project-local `.cursor/rules/kkauto-*.mdc` and `.cursor/mcp.json`.
- `install --agent auto` detects installed agents and remains non-interactive-safe.
- `install --agent all` installs all detected supported agents and reports per-agent results.

## Safety Model

- Generated MCP config uses placeholders for `KK_API_BASE_URL` and `KK_API_TOKEN`.
- Secret-like values are redacted in doctor/error paths.
- Config writers parse and merge JSON/TOML instead of appending raw text.
- Cursor docs warn users not to commit `.cursor/mcp.json` after replacing placeholders with real tokens.
