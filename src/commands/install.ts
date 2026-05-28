import { cp, mkdtemp, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { createContext } from '../agents/index.js';
import { resolveAgent } from '../agents/detect.js';
import type { AgentName, InstallTarget } from '../agents/types.js';
import { defaultMcpInput } from '../core/templates.js';
import { ensureDir, pathExists } from '../core/file-utils.js';
import { loadManifest, packSourcePaths, resolvePacks, skillsRoot } from '../core/manifest.js';
import { mergeJsonMcpConfig, mergeTomlMcpConfig } from '../core/config-writer.js';
import { type RegistryInstall, upsertInstall } from '../core/registry.js';

export interface InstallOptions {
  agent?: AgentName | 'auto';
  packs?: string;
  dryRun?: boolean;
  mcpConfig?: boolean;
  json?: boolean;
  emit?: boolean;
}

export interface InstallResult {
  agent: AgentName;
  packs: string[];
  targets: RegistryInstall['targets'];
  dryRun: boolean;
}

const require = createRequire(import.meta.url);

async function packageVersion(): Promise<string> {
  const packageJson = require('../../package.json') as { version: string };
  return packageJson.version;
}

async function copyPacks(target: InstallTarget, packs: string[], dryRun: boolean): Promise<string[]> {
  const planned = [];
  const root = skillsRoot();
  const sources = await packSourcePaths(packs, root);
  if (dryRun) return packs.map((pack) => `${pack} -> ${target.path}`);
  const parentDir = dirname(target.path);
  await ensureDir(parentDir);
  const stagingDir = await mkdtemp(join(parentDir, '.kkauto-skill-'));
  const stagingTarget = join(stagingDir, basename(target.path));
  await ensureDir(stagingTarget);
  for (const source of sources) {
    const packName = source.endsWith('/core') ? 'core' : source.split('/').at(-1) ?? 'pack';
    const destination = join(stagingTarget, packName);
    await cp(source, destination, { recursive: true });
    planned.push(`${packName} -> ${join(target.path, packName)}`);
  }
  const backupTarget = `${target.path}.previous-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const hadExistingTarget = await pathExists(target.path);
  try {
    if (hadExistingTarget) await rename(target.path, backupTarget);
    await rename(stagingTarget, target.path);
    if (hadExistingTarget) await rm(backupTarget, { recursive: true, force: true });
  } catch (error) {
    if (hadExistingTarget && !(await pathExists(target.path)) && await pathExists(backupTarget)) {
      await rename(backupTarget, target.path);
    }
    throw error;
  } finally {
    await rm(stagingDir, { recursive: true, force: true });
  }
  return planned;
}

export async function runInstall(options: InstallOptions): Promise<InstallResult> {
  const adapter = await resolveAgent(options.agent ?? 'auto');
  const context = createContext();
  const manifest = await loadManifest();
  const packs = resolvePacks(manifest, options.packs);
  const skillTarget = (await adapter.getSkillTargets(context))[0];
  const copied = await copyPacks(skillTarget, packs, Boolean(options.dryRun));
  const targets: RegistryInstall['targets'] = [{ type: 'skill', path: skillTarget.path }];
  const messages = [`Agent: ${adapter.displayName}`, `Packs: ${packs.join(', ')}`];
  messages.push(...copied.map((item) => `${options.dryRun ? 'Would copy' : 'Copied'} ${item}`));

  if (options.mcpConfig !== false) {
    const mcpTarget = await adapter.getMcpConfigTarget(context);
    if (mcpTarget) {
      targets.push({ type: 'mcp-config' as const, path: mcpTarget.path });
      if (mcpTarget.mode === 'manual') {
        messages.push(`Manual MCP config required for ${mcpTarget.path}`);
        messages.push(await adapter.renderMcpConfig(defaultMcpInput()));
      } else if (mcpTarget.mode === 'toml-merge') {
        const result = await mergeTomlMcpConfig(mcpTarget.path, defaultMcpInput(), Boolean(options.dryRun));
        messages.push(result.message);
      } else if (mcpTarget.mode === 'json-merge') {
        const result = await mergeJsonMcpConfig(mcpTarget.path, defaultMcpInput(), Boolean(options.dryRun));
        messages.push(result.message);
      }
    }
  }

  if (!options.dryRun) {
    const now = new Date().toISOString();
    await upsertInstall({
      agent: adapter.name,
      installedAt: now,
      updatedAt: now,
      packageVersion: await packageVersion(),
      packs,
      targets
    });
  }

  messages.push('Next: replace KK_API_BASE_URL and KK_API_TOKEN placeholders in your agent MCP config.');
  const result = { agent: adapter.name, packs, targets, dryRun: Boolean(options.dryRun) };
  if (options.emit !== false) {
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else process.stdout.write(`${messages.join('\n')}\n`);
  }
  return result;
}

export async function hasInstalledConfig(path: string): Promise<boolean> {
  return pathExists(path);
}
