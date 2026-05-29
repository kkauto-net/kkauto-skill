# Agent Support

Supported agents: `claude`, `opencode`, `codex`, `antigravity`, `cursor`.

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

## Cursor

- Rule path: `.cursor/rules/kkauto-*.mdc` in the current project.
- MCP config target: `.cursor/mcp.json` in the current project.
- Format: JSON `mcpServers.kkauto`.
- Installer writes project-local Cursor artifacts only. It does not write global Cursor config or legacy `.cursorrules`.
- If you replace placeholders with real tokens in `.cursor/mcp.json`, do not commit that file. Add it to `.gitignore` or keep token values in an untracked local config.

## Install Selection

- `--agent auto` installs the single detected agent. In an interactive TTY, it prompts when multiple agents are detected.
- `--agent all` installs all detected supported agents and reports per-agent success or failure.
- In `--json` or non-interactive mode, `auto` never prompts; pass a concrete agent or `all` when multiple agents are detected.

## Notes

- All agents use `npx -y kkauto-mcp`.
- `print-config` never writes files.
- `doctor` redacts secret-like values.
