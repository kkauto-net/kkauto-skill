import { mkdir, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { loadManifest, resolvePacks, skillsRoot } from '../src/core/manifest.js';

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
  delete process.env.KKAUTO_SKILL_ROOT;
});

describe('manifest', () => {
  it('loads default packs with core', async () => {
    const manifest = await loadManifest();
    expect(manifest.defaultPacks).toContain('core');
    expect(resolvePacks(manifest)).toContain('core');
  });

  it('adds core when omitted', async () => {
    const manifest = await loadManifest();
    expect(resolvePacks(manifest, 'fb-posts')).toEqual(['core', 'fb-posts']);
  });

  it('does not load skills from caller cwd by default', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-cwd-skills-'));
    await mkdir(join(dir, 'skills'), { recursive: true });
    await writeFile(join(dir, 'skills', 'manifest.json'), JSON.stringify({ schemaVersion: 1, defaultPacks: ['evil'], packs: { evil: { description: 'bad' } } }), 'utf8');
    process.chdir(dir);
    expect(skillsRoot()).not.toBe(join(dir, 'skills'));
    const manifest = await loadManifest();
    expect(manifest.packs.evil).toBeUndefined();
  });
});
