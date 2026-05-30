import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { antigravityAdapter } from '../src/agents/antigravity.js';

describe('antigravity adapter', () => {
  it('fails automatic target selection when both legacy config paths exist', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-ag-'));
    const first = join(homeDir, '.gemini', 'antigravity', 'mcp_config.json');
    const second = join(homeDir, '.gemini', 'config', 'mcp_config.json');
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(join(homeDir, '.gemini', 'antigravity'), { recursive: true });
    await mkdir(join(homeDir, '.gemini', 'config'), { recursive: true });
    await writeFile(first, '{}', 'utf8');
    await writeFile(second, '{}', 'utf8');
    const target = await antigravityAdapter.getMcpConfigTarget({ homeDir });
    expect(target?.mode).toBe('manual');
  });

  it('uses shared MCP path when no legacy conflict exists', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-ag-empty-'));
    const target = await antigravityAdapter.getMcpConfigTarget({ homeDir });
    expect(target?.mode).toBe('json-merge');
    expect(target?.path).toContain(join('.gemini', 'config', 'mcp_config.json'));
  });

  it('writes per-pack skill paths for global scope', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-ag-skills-'));
    const targets = await antigravityAdapter.getSkillTargets({ homeDir, antigravityScopes: ['global'] });
    expect(targets[0].mode).toBe('skill-file');
    expect(targets[0].path).toContain('antigravity-cli');
  });
});
