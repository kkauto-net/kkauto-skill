# Agent Support

## Claude

- Skill path: `~/.claude/skills/kkauto`
- MCP config target: `~/.claude/mcp.json`
- Format: JSON `mcpServers.kkauto`

## OpenCode

- Skill path: `~/.config/opencode/skills/kkauto`
- MCP config target: `~/.config/opencode/opencode.json`
- Format: JSON `mcpServers.kkauto`

## Codex CLI

- Skill path: `~/.codex/skills/kkauto`
- MCP config target: `~/.codex/config.toml`
- Format: TOML `[mcp_servers.kkauto]`
- Installer uses safe TOML parse/merge. Future versions may prefer `codex mcp add` when available and stable.

## Antigravity CLI

- Skill path: `~/.gemini/antigravity/skills/kkauto`
- Primary MCP config candidate: `~/.gemini/antigravity/mcp_config.json`
- Secondary candidate: `~/.gemini/config/mcp_config.json`
- Format: JSON `mcpServers.kkauto`
- If both config candidates exist, installer refuses silent auto-write and prints manual guidance.

## Notes

- All agents use `npx -y kkauto-mcp`.
- `print-config` never writes files.
- `doctor` redacts secret-like values.
