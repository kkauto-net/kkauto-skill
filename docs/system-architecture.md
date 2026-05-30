# System Architecture

## Overview

`kkauto-skill` is a file-writing CLI. It reads package skill assets, resolves target agents, writes skill files/rules, merges MCP config, stores credential state, and records installs. It does not host MCP and does not call kkAuto APIs.

## High-Level Flow

```text
user command
  -> src/cli.ts
  -> src/commands/{install|update|doctor|list|print-config}.ts
  -> src/agents/* adapter selection
  -> src/core/* shared services
  -> user home/project files
```

## Install Flow

```text
install
  -> resolve agents (`auto`, `all`, or explicit)
  -> resolve credentials mode (`wrapper`, `placeholder`, or skip -> placeholder launch)
  -> load `skills/manifest.json`
  -> resolve packs, always include `core`
  -> write skills/rules per agent
  -> merge MCP config unless `--no-mcp-config`
  -> upsert registry install
```

## Update Flow

`update` reads `~/.config/kkauto-skill/registry.json` and replays each install through `runInstall()` with stored agent and packs. Cursor installs derive `projectDir` from the registered `.cursor` target, so update writes to the original project path.

## Runtime Boundaries

| Component | Responsibility | Explicit non-goal |
| --- | --- | --- |
| `kkauto-skill` | Install skills and MCP config. | Does not run MCP server. |
| `kkauto-mcp` | Runtime MCP server launched by agents. | Not implemented in this repo. |
| AI agents | Load skills/rules and start MCP server. | Agent internals not controlled here. |

## Agent Targets

| Agent | Skill target | MCP target | Format |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills/kkauto` | `~/.claude/.mcp.json` fallback `~/.claude/mcp.json` | JSON `mcpServers.kkauto` |
| OpenCode | `~/.config/opencode/skills/kkauto` | `~/.config/opencode/opencode.json` | JSON `mcpServers.kkauto` |
| Codex CLI | `~/.codex/skills/kkauto` | `~/.codex/config.toml` | TOML `mcp_servers.kkauto` |
| Cursor | `<project>/.cursor/rules/kkauto-*.mdc` | `<project>/.cursor/mcp.json` | JSON `mcpServers.kkauto` |
| Antigravity workspace | `<project>/.agents/skills/{pack}/SKILL.md` | `<project>/.agents/mcp_config.json` | JSON `mcpServers.kkauto` |
| Antigravity global | `~/.gemini/antigravity-cli/skills/{pack}/SKILL.md` | `~/.gemini/config/mcp_config.json` | JSON `mcpServers.kkauto` |
| Antigravity shared | `~/.gemini/skills/{pack}/SKILL.md` | `~/.gemini/config/mcp_config.json` | JSON `mcpServers.kkauto` |

## State Files

| File | Owner | Purpose |
| --- | --- | --- |
| `~/.config/kkauto-skill/credentials.env` | `src/core/credentials.ts` | Stores kkAuto URL/token and optional MCP env. |
| `~/.config/kkauto-skill/registry.json` | `src/core/registry.ts` | Tracks installs for update replay. |
| Agent MCP configs | `src/core/config-writer.ts` | Merged kkAuto MCP server config. |
| Agent skills/rules | `src/commands/install.ts` | Installed instruction packs. |

## MCP Launch Modes

| Mode | Trigger | Config shape |
| --- | --- | --- |
| Wrapper | Default when credentials exist or are provided. | `command: bash`, `args: ['-lc', 'parse whitelisted credentials.env keys ... exec npx -y kkauto-mcp']` |
| Placeholder | `--use-placeholders` or no usable credentials. | `command: npx`, `args: ['-y','kkauto-mcp']`, placeholder env. |

## Build And Package

`npm run build` runs `tsc -p tsconfig.json` then `node scripts/copy-assets.mjs`. The script copies `skills/` and `templates/` into `dist/` so the published CLI can resolve package assets.

## Related Docs

- [Agent Support](./agents.md)
- [Security](./security.md)
- [Packs](./packs.md)
- [Deployment Guide](./deployment-guide.md)
