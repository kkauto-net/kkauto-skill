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

1. Chọn AI agents (mặc định chọn hết)
2. Nhập kkAuto URL + API token (từ `/wtadmin/mcp`)
3. Cài skills + MCP config cho từng agent

Credentials lưu tại `~/.config/kkauto-skill/credentials.env`. MCP configs dùng wrapper load file này — không ghi token inline vào `.cursor/mcp.json` hay config agent khác.

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
