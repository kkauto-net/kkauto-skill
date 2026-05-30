# Security

## Token Handling

- Default install stores secrets in `~/.config/kkauto-skill/credentials.env` (file mode `600`).
- MCP agent configs use a bash wrapper that parses whitelisted `KEY=value` lines literally; tokens are not inlined in Claude/Cursor/Antigravity JSON or Codex TOML by default.
- `--use-placeholders` writes inline placeholder env only (legacy behavior).
- `doctor` redacts token-like values and never prints raw `KK_API_TOKEN`.
- Never paste real tokens into chat, GitHub issues, logs, screenshots, or docs.

## CI Security Gates

- `npm run test:security` covers redaction, wrapper mode, credential file permissions, and compiled CLI no-leak behavior.
- `npm run security:audit` runs `npm audit --audit-level=high`; high/critical advisories should fail CI unless fixed or explicitly waived in review.
- CodeQL runs JavaScript/TypeScript static analysis on push, pull request, and weekly schedule.
- Dependency review runs on pull requests to catch risky dependency changes.
- CI and nightly jobs use fake values only. Do not add repository secrets to test jobs.
- Workflows must not upload temp HOME/project sandboxes because generated configs may contain local credential paths or placeholder env blocks.

## Delete Tools

`KK_MCP_ENABLE_DELETE` is not enabled by default. Optional MCP tuning vars can be stored in `credentials.env`.

## Config Writes

- Existing config files are backed up before writes.
- JSON and TOML are parsed and merged, not string-appended.
- Unknown JSON fields are preserved.
- Ambiguous legacy Antigravity MCP paths block silent writes.

## Scope

This package installs agent instructions and MCP config. It does not call kkAuto APIs, store customer content, access databases, or run browser automation.
