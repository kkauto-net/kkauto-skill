import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathExists } from './file-utils.js';

export interface PackManifestEntry {
  required?: boolean;
  description: string;
  requiresMcpTools?: string[];
}

export interface SkillManifest {
  schemaVersion: number;
  defaultPacks: string[];
  packs: Record<string, PackManifestEntry>;
}

export function packageRoot(): string {
  const current = dirname(fileURLToPath(import.meta.url));
  return dirname(dirname(current));
}

export function skillsRoot(): string {
  const candidates = [
    process.env.KKAUTO_SKILL_ROOT ? join(process.env.KKAUTO_SKILL_ROOT, 'skills') : '',
    join(packageRoot(), 'skills')
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (statSyncSafe(candidate)) return candidate;
    } catch {
      // keep searching
    }
  }
  return join(process.cwd(), 'skills');
}

function statSyncSafe(path: string): boolean {
  return existsSync(path);
}

export async function loadManifest(root = skillsRoot()): Promise<SkillManifest> {
  const manifestPath = join(root, 'manifest.json');
  const raw = await readFile(manifestPath, 'utf8');
  return JSON.parse(raw) as SkillManifest;
}

export function resolvePacks(manifest: SkillManifest, requested?: string): string[] {
  const selected = requested ? requested.split(',').map((pack) => pack.trim()).filter(Boolean) : manifest.defaultPacks;
  const withCore = selected.includes('core') ? selected : ['core', ...selected];
  for (const pack of withCore) {
    if (!manifest.packs[pack]) throw new Error(`Unknown pack: ${pack}`);
  }
  return [...new Set(withCore)];
}

export async function packSourcePaths(packs: string[], root = skillsRoot()): Promise<string[]> {
  const paths = [];
  for (const pack of packs) {
    const path = pack === 'core' ? join(root, 'core') : join(root, 'packs', pack);
    if (!(await pathExists(join(path, 'SKILL.md')))) throw new Error(`Missing SKILL.md for pack: ${pack}`);
    paths.push(path);
  }
  return paths;
}

export async function listPackFiles(path: string): Promise<string[]> {
  const entries = await readdir(path);
  return entries.filter((entry) => entry.endsWith('.md'));
}
