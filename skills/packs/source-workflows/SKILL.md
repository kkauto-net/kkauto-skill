---
name: kkauto-source-workflows
description: Use this skill for kkAuto Source Workflow AI-agent mode: getting workflow context, claiming Source Posts, generating content, creating FB Posts from claims, releasing claims, and failing claims safely.
---

# kkAuto Source Workflows

Use these MCP tools: `get_source_workflow_agent_context`, `claim_source_workflow_posts`, `create_fb_post_from_source_workflow_claim`, `release_source_workflow_claim`, `fail_source_workflow_claim`.

## Workflow

1. Start with `get_source_workflow_agent_context`.
2. Continue only for enabled workflows with `consumer_mode=ai_agent`.
3. Claim eligible posts with `claim_source_workflow_posts`.
4. Generate content in the agent, using workflow rules and rewrite prompts as guidance.
5. Create output only with `create_fb_post_from_source_workflow_claim` and the owned `claim_token`.
6. Release claims if not writing.
7. Fail claim with a capped reason when output cannot be produced.

## Rules

- `claim_token` proves claim ownership, not API authentication.
- Do not create duplicate output for posts skipped as already claimed.
- Confirm final generated FB post content before creating it.
