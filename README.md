# kkauto-skill

Install and update kkAuto AI-agent skills plus local MCP config for Claude, OpenCode, Codex, Antigravity CLI, and Cursor.

`kkauto-skill` is the instruction/config layer only. Runtime stays `kkauto-mcp`:

```bash
npx -y kkauto-mcp
```

## Quick Start

```bash
npx kkauto-skill install --agent auto
npx kkauto-skill doctor --agent opencode
```

After install, edit your agent MCP config and replace placeholders:

```text
KK_API_BASE_URL=https://your-tenant.example.com
KK_API_TOKEN=paste-token-here
```

Do not paste real tokens into chat, issues, logs, or docs.
For Cursor project installs, do not commit `.cursor/mcp.json` after replacing placeholders with real tokens.

## Commands

```bash
npx kkauto-skill install --agent claude --packs core,fb-posts,source-workflows
npx kkauto-skill install --agent all
npx kkauto-skill install --agent cursor
npx kkauto-skill update
npx kkauto-skill list
npx kkauto-skill print-config --agent codex
npx kkauto-skill doctor --agent antigravity --json
```

Use `--agent auto` for safe detection. If multiple supported agents are detected in a non-interactive shell, pass a concrete agent name or `--agent all`.

## Safety

- No direct kkAuto HTTP API calls.
- No `kkauto-mcp` reimplementation.
- No postinstall scripts.
- No raw token printing.
- Delete tools stay disabled unless you explicitly configure `KK_MCP_ENABLE_DELETE=true` outside this installer.
- Config writes use backups and conservative merge behavior.

## Default Packs

- `core`
- `source-workflows`
- `fb-posts`

See `docs/packs.md` for all packs.

## Supported Agents

Supported values: `claude`, `opencode`, `codex`, `antigravity`, `cursor`.

See `docs/agents.md` for exact config behavior and limitations.

## License

MIT
