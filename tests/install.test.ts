import { describe, expect, it } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { opencodeAdapter } from '../src/agents/opencode.js';

describe('install targets', () => {
  it('uses mocked home directory for OpenCode targets', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-home-'));
    const targets = await opencodeAdapter.getSkillTargets({ homeDir });
    expect(targets[0].path).toContain(homeDir);
    expect(targets[0].path).toContain('opencode');
  });
});
