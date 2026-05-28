---
name: kk-source-crawlers
description: Use this skill for kkAuto Source Crawler workflows: listing crawlers, inspecting crawler state, creating/updating crawlers, pause/resume, hashtag relations, account relations, and guarded deletion.
---

# kkAuto Source Crawlers

Use source-crawler MCP tools such as `list_source_crawlers`, `get_source_crawler`, `list_source_crawler_posts`, `create_source_crawler`, `update_source_crawler`, `pause_source_crawler`, `resume_source_crawler`, relation tools, and guarded delete tools.

## Workflow

1. Read crawler state with `get_source_crawler` before lifecycle or relation changes.
2. Confirm before pause, resume, create, update, relation add/remove, or delete.
3. For bulk account add, show count and sample account IDs before asking confirmation.
4. For resume, verify required linked accounts or explain backend rejection.
5. For delete/remove relation, require delete enablement, preflight, expected name/ID, and reason.

## Safety

- Do not infer account permissions beyond tool output.
- Preserve unknown crawler settings unless user explicitly changes them.
