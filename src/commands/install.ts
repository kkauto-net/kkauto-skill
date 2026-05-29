import { cp, mkdtemp, readdir, readFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { createContext } from '../agents/index.js';
import type { AgentAdapter, AgentName, InstallAgentSelector, InstallTarget } from '../agents/types.js';
import { resolveInstallAgents } from './install-agent-selection.js';
import { defaultMcpInput } from '../core/templates.js';
import { ensureDir, pathExists, writeTextFile } from '../core/file-utils.js';
import { loadManifest, packSourcePaths, resolvePacks, skillsRoot, type SkillManifest } from '../core/manifest.js';
import { mergeJsonMcpConfig, mergeTomlMcpConfig } from '../core/config-writer.js';
import { type RegistryInstall, upsertInstall } from '../core/registry.js';
import { redact } from '../core/redaction.js';

export interface InstallOptions {
  agent?: InstallAgentSelector;
  packs?: string;
  dryRun?: boolean;
  mcpConfig?: boolean;
  json?: boolean;
  emit?: boolean;
  homeDir?: string;
  projectDir?: string;
}

export interface InstallResult {
  agent: AgentName;
  ok: true;
  packs: string[];
  targets: RegistryInstall['targets'];
  dryRun: boolean;
}

export interface FailedInstallResult {
  agent: AgentName;
  ok: false;
  error: string;
  dryRun: boolean;
}

export interface MultiInstallResult {
  selector: InstallAgentSelector;
  dryRun: boolean;
  results: Array<InstallResult | FailedInstallResult>;
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
    const packName = basename(source);
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

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trimStart();
}

async function writeCursorRules(target: InstallTarget, packs: string[], manifest: SkillManifest, dryRun: boolean): Promise<string[]> {
  const root = skillsRoot();
  const sources = await packSourcePaths(packs, root);
  const planned = [];
  const expectedFiles = new Set(sources.map((source) => `kkauto-${basename(source)}.mdc`));
  if (!dryRun) {
    await ensureDir(target.path);
    const existing = await readdir(target.path).catch(() => []);
    for (const entry of existing) {
      if (entry.startsWith('kkauto-') && entry.endsWith('.mdc') && !expectedFiles.has(entry)) {
        await rm(join(target.path, entry), { force: true });
        planned.push(`removed stale ${join(target.path, entry)}`);
      }
    }
  }
  for (const source of sources) {
    const packName = basename(source);
    const destination = join(target.path, `kkauto-${packName}.mdc`);
    planned.push(`${packName} -> ${destination}`);
    if (dryRun) continue;
    const skill = await readFile(join(source, 'SKILL.md'), 'utf8');
    const description = manifest.packs[packName]?.description ?? `kkAuto ${packName} workflows`;
    const content = [
      '---',
      `description: ${JSON.stringify(`Use kkAuto ${description} through configured MCP tools.`)}`,
      'alwaysApply: false',
      '---',
      '',
      stripFrontmatter(skill),
      ''
    ].join('\n');
    await writeTextFile(destination, content);
  }
  return planned;
}

async function writeSkillTarget(target: InstallTarget, packs: string[], manifest: SkillManifest, dryRun: boolean): Promise<string[]> {
  if (target.mode === 'cursor-rules') return writeCursorRules(target, packs, manifest, dryRun);
  return copyPacks(target, packs, dryRun);
}

async function installOne(adapter: AgentAdapter, options: InstallOptions, manifest: SkillManifest, packs: string[]): Promise<{ result: InstallResult; messages: string[] }> {
  const context = createContext(options.homeDir, options.projectDir);
  const skillTarget = (await adapter.getSkillTargets(context))[0];
  const copied = await writeSkillTarget(skillTarget, packs, manifest, Boolean(options.dryRun));
  const targets: RegistryInstall['targets'] = [{ type: 'skill', path: skillTarget.path }];
  const messages = [`Agent: ${adapter.displayName}`, `Packs: ${packs.join(', ')}`];
  messages.push(...copied.map((item) => `${options.dryRun ? 'Would write' : 'Wrote'} ${item}`));

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

  if (adapter.name === 'cursor') {
    messages.push('Cursor warning: do not commit .cursor/mcp.json after replacing placeholders with real tokens.');
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
    }, options.homeDir);
  }

  messages.push('Next: replace KK_API_BASE_URL and KK_API_TOKEN placeholders in your agent MCP config.');
  return { result: { agent: adapter.name, ok: true, packs, targets, dryRun: Boolean(options.dryRun) }, messages };
}

export async function runInstall(options: InstallOptions): Promise<InstallResult | MultiInstallResult> {
  const selector = options.agent ?? 'auto';
  const adapters = await resolveInstallAgents({ selector, json: options.json, homeDir: options.homeDir, projectDir: options.projectDir });
  const manifest = await loadManifest();
  const packs = resolvePacks(manifest, options.packs);
  const multi = selector === 'all' || adapters.length > 1;

  if (!multi) {
    const { result, messages } = await installOne(adapters[0], options, manifest, packs);
    if (options.emit !== false) {
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else process.stdout.write(`${messages.join('\n')}\n`);
    }
    return result;
  }

  const results: MultiInstallResult['results'] = [];
  const allMessages: string[] = [];
  for (const adapter of adapters) {
    try {
      const { result, messages } = await installOne(adapter, options, manifest, packs);
      results.push(result);
      allMessages.push(...messages, '');
    } catch (error) {
      const message = redact(error instanceof Error ? error.message : String(error));
      results.push({ agent: adapter.name, ok: false, error: message, dryRun: Boolean(options.dryRun) });
      allMessages.push(`Agent: ${adapter.displayName}`, `Failed: ${message}`, '');
    }
  }

  const result: MultiInstallResult = { selector, dryRun: Boolean(options.dryRun), results };
  if (options.emit !== false) {
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else process.stdout.write(`${allMessages.join('\n').trimEnd()}\n`);
  }
  if (results.some((item) => !item.ok)) throw new Error('One or more agent installs failed.');
  return result;
}

export async function hasInstalledConfig(path: string): Promise<boolean> {
  return pathExists(path);
}
