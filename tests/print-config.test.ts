import { describe, expect, it } from 'vitest';
import { getAdapter } from '../src/agents/index.js';
import { defaultMcpInput } from '../src/core/templates.js';

describe('print config rendering', () => {
  it.each(['claude', 'opencode', 'antigravity', 'cursor'] as const)('renders JSON for %s', async (agent) => {
    const config = await getAdapter(agent).renderMcpConfig(defaultMcpInput());
    expect(JSON.parse(config).mcpServers.kkauto.command).toBe('npx');
    expect(config).toContain('paste-token-here');
  });

  it('renders TOML for codex', async () => {
    const config = await getAdapter('codex').renderMcpConfig(defaultMcpInput());
    expect(config).toContain('[mcp_servers.kkauto]');
    expect(config).toContain('kkauto-mcp');
  });
});
