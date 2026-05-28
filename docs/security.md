# Security

## Token Handling

- `kkauto-skill` does not ask for `KK_API_TOKEN`.
- Generated config uses `paste-token-here` placeholder only.
- `doctor` redacts token-like values.
- Never paste real tokens into chat, GitHub issues, logs, screenshots, or docs.

## Delete Tools

`KK_MCP_ENABLE_DELETE` is not written by default. Delete tools require explicit user-side config and MCP tool confirmation fields.

## Config Writes

- Existing config files are backed up before writes.
- JSON and TOML are parsed and merged, not string-appended.
- Unknown JSON fields are preserved.
- Ambiguous Antigravity config paths block silent writes.

## Scope

This package installs agent instructions and MCP config. It does not call kkAuto APIs, store customer content, access databases, or run browser automation.
