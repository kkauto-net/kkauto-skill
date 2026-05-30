# kkauto-skill

Install and update kkAuto AI-agent skills plus MCP config for Claude Code, OpenCode, Codex, Antigravity CLI, and Cursor.

Runtime stays `kkauto-mcp`:

```bash
npx -y kkauto-mcp
```

## Quick Start

```bash
npx kkauto-skill install
```

Interactive install (TTY):

1. Select AI agents (default: all checked)
2. Enter kkAuto URL + API token from `/wtadmin/mcp`
3. Install skills + MCP config for each selected agent

Credentials are stored in `~/.config/kkauto-skill/credentials.env`. MCP configs use a wrapper that loads this file; real tokens are not written inline to `.cursor/mcp.json` or other agent configs by default.

## Commands

```bash
npx kkauto-skill install
npx kkauto-skill install --agent all --no-interactive --use-placeholders
npx kkauto-skill install --agent antigravity --antigravity-scopes global
npx kkauto-skill update
npx kkauto-skill list
npx kkauto-skill print-config --agent codex
npx kkauto-skill doctor --json
```

Non-interactive with credentials:

```bash
KK_API_BASE_URL=https://your-tenant.example.com \
KK_API_TOKEN=paste-token-here \
npx kkauto-skill install --agent all --no-interactive
```

Do not paste real tokens into chat, issues, logs, or docs.

## Default Packs

- `core`
- `source-workflows`
- `fb-posts`

See `docs/packs.md` for all packs.

## Supported Agents

Supported values: `claude`, `opencode`, `codex`, `antigravity`, `cursor`.

See `docs/agents.md` for exact paths, Antigravity scopes, and MCP behavior.

## License

MIT
