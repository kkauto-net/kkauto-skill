import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readRegistry, writeRegistry } from '../src/core/registry.js';
import { runInstall } from '../src/commands/install.js';
import { runUpdate } from '../src/commands/update.js';

describe('update registry', () => {
  it('returns empty registry when missing', async () => {
    const registry = await readRegistry('/tmp/kkauto-skill-missing-home');
    expect(registry.installs).toEqual([]);
  });

  it('updates Cursor installs using the registered project path', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-update-home-'));
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-update-project-'));
    const wrongProjectDir = await mkdtemp(join(tmpdir(), 'kkauto-update-wrong-project-'));
    const now = new Date().toISOString();
    await writeRegistry({
      schemaVersion: 1,
      installs: [{
        agent: 'cursor',
        installedAt: now,
        updatedAt: now,
        packageVersion: '0.1.0',
        packs: ['core'],
        targets: [
          { type: 'skill', path: join(projectDir, '.cursor', 'rules') },
          { type: 'mcp-config', path: join(projectDir, '.cursor', 'mcp.json') }
        ]
      }]
    }, homeDir);
    await mkdir(join(wrongProjectDir, '.cursor'), { recursive: true });

    const previousCwd = process.cwd();
    try {
      process.chdir(wrongProjectDir);
      await runUpdate({ dryRun: false, homeDir, emit: false });
    } finally {
      process.chdir(previousCwd);
    }

    const rule = await readFile(join(projectDir, '.cursor', 'rules', 'kkauto-core.mdc'), 'utf8');
    expect(rule).toContain('kkAuto Core');
    await expect(readFile(join(wrongProjectDir, '.cursor', 'rules', 'kkauto-core.mdc'), 'utf8')).rejects.toThrow();
  });

  it('stores separate Cursor installs per project', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-registry-home-'));
    const firstProjectDir = await mkdtemp(join(tmpdir(), 'kkauto-registry-project-a-'));
    const secondProjectDir = await mkdtemp(join(tmpdir(), 'kkauto-registry-project-b-'));

    await runInstall({ agent: 'cursor', packs: 'core', homeDir, projectDir: firstProjectDir, emit: false });
    await runInstall({ agent: 'cursor', packs: 'core', homeDir, projectDir: secondProjectDir, emit: false });

    const registry = await readRegistry(homeDir);
    const cursorInstalls = registry.installs.filter((install) => install.agent === 'cursor');
    expect(cursorInstalls).toHaveLength(2);
    expect(cursorInstalls.map((install) => install.targets[0].path).sort()).toEqual([
      join(firstProjectDir, '.cursor', 'rules'),
      join(secondProjectDir, '.cursor', 'rules')
    ].sort());
  });
});
