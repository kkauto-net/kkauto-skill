---
name: kk-fb-posts
description: Use this skill for kkAuto FB Post workflows: listing posts, inspecting one post, drafting posts, creating, updating, uploading media, or deleting FB Posts through kkAuto MCP tools.
---

# kkAuto FB Posts

Use these MCP tools: `list_fb_posts`, `get_fb_post`, `create_fb_post`, `update_fb_post`, `delete_fb_post`.

## Workflow

1. Inspect existing posts when relevant with `list_fb_posts` or `get_fb_post`.
2. Draft `title`, `content`, post target, media mode, and status.
3. Ask confirmation before `create_fb_post` or `update_fb_post`.
4. Use `media` for remote URLs and `media_files` for local files. Never mix both.
5. Remind user that `media_files` paths are local to the MCP client machine.
6. Before delete, fetch the post, confirm title/ID, require reason, then call `delete_fb_post` only if delete is enabled.

## Notes

- Image files should be `.jpg`, `.jpeg`, `.png`, or `.gif`.
- Updates omit unchanged fields.
- Multipart media update replaces existing media.
