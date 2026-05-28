import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { antigravityAdapter } from '../src/agents/antigravity.js';

describe('antigravity adapter', () => {
  it('fails automatic target selection when both config paths exist', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-ag-'));
    const first = join(homeDir, '.gemini', 'antigravity', 'mcp_config.json');
    const second = join(homeDir, '.gemini', 'config', 'mcp_config.json');
    await mkdir(join(homeDir, '.gemini', 'antigravity'), { recursive: true });
    await mkdir(join(homeDir, '.gemini', 'config'), { recursive: true });
    await writeFile(first, '{}', 'utf8');
    await writeFile(second, '{}', 'utf8');
    const target = await antigravityAdapter.getMcpConfigTarget({ homeDir });
    expect(target?.mode).toBe('manual');
  });

  it('uses manual target when no config path exists', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-ag-empty-'));
    const target = await antigravityAdapter.getMcpConfigTarget({ homeDir });
    expect(target?.mode).toBe('manual');
    expect(target?.path).toContain('.gemini');
  });
});
