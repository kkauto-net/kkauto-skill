# Skill Packs

## Default Packs

- `core`: required safety, auth, MCP usage, confirmation rules.
- `source-workflows`: Source-to-FB claim/write workflow for AI-agent mode.
- `fb-posts`: FB Post creation/update/media/delete guidance.

## Optional Packs

- `source-posts`: Source Post search, inspect, status, create/update/delete.
- `source-crawlers`: Source Crawler lifecycle and relation management.

## Install Examples

```bash
npx kkauto-skill install --agent opencode
npx kkauto-skill install --agent codex --packs core,source-posts,source-crawlers
```

Core is always included even if omitted.
