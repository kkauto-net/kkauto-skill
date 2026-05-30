# Agent Support

Supported agents: `claude`, `opencode`, `codex`, `antigravity`, `cursor`.

All agents use `npx -y kkauto-mcp` as the MCP runtime. By default, `kkauto-skill install` stores `KK_API_BASE_URL` and `KK_API_TOKEN` in `~/.config/kkauto-skill/credentials.env` (mode `600`) and writes MCP configs with a bash wrapper that parses whitelisted `KEY=value` lines literally — secrets are not inlined in agent config files.

Use `--use-placeholders` for legacy inline placeholder env blocks.

## Claude Code

- Skill path: `~/.claude/skills/kkauto`
- MCP config target: `~/.claude/.mcp.json` (fallback: `~/.claude/mcp.json`)
- Format: JSON `mcpServers.kkauto`

## OpenCode

- Skill path: `~/.config/opencode/skills/kkauto`
- MCP config target: `~/.config/opencode/opencode.json`
- Format: JSON `mcpServers.kkauto`

## Codex CLI

- Skill path: `~/.codex/skills/kkauto`
- MCP config target: `~/.codex/config.toml`
- Format: TOML `[mcp_servers.kkauto]`

## Antigravity CLI

Skills (per pack, e.g. `core`, `fb-posts`):

| Scope | Path |
| --- | --- |
| Workspace | `.agents/skills/{pack}/SKILL.md` |
| Global (default) | `~/.gemini/antigravity-cli/skills/{pack}/SKILL.md` |
| Shared | `~/.gemini/skills/{pack}/SKILL.md` |

MCP config:

| Scope | Path |
| --- | --- |
| Shared / Global | `~/.gemini/config/mcp_config.json` |
| Workspace | `.agents/mcp_config.json` |

TTY install prompts for skill scopes (default: Global only). Non-interactive: `--antigravity-scopes global|workspace,shared`.

Legacy `~/.gemini/antigravity/mcp_config.json`: if multiple legacy candidates conflict, installer prints manual guidance.

## Cursor

- Rules: `.cursor/rules/kkauto-*.mdc` in the current project
- MCP config: `.cursor/mcp.json` in the current project
- Format: JSON `mcpServers.kkauto`
- With credentials wrapper, `.cursor/mcp.json` contains no inline token and is safer to commit

## Install Selection

Interactive `npx kkauto-skill install`:

1. Checkbox all 5 agents (default: all checked)
2. URL + API token → `credentials.env`
3. Antigravity scope picker when Antigravity is selected (default: Global)

Non-interactive:

```bash
KK_API_BASE_URL=https://tenant.example.com KK_API_TOKEN=... \
  npx kkauto-skill install --agent all --no-interactive

npx kkauto-skill install --agent cursor --base-url https://tenant.example.com --api-token ... --no-interactive
```

## Notes

- `print-config --agent <name>` renders wrapper config when credentials exist
- `doctor` reports credentials file health and per-agent MCP wrapper status without printing secrets
