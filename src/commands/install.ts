import { cp, mkdtemp, readdir, readFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { basename, dirname, join } from 'node:path';
import { createContext } from '../agents/index.js';
import { antigravityMcpTargets, resolveAntigravityScopes } from '../agents/antigravity.js';
import type { AgentAdapter, AgentName, InstallAgentSelector, InstallTarget } from '../agents/types.js';
import { resolveInstallAgents } from './install-agent-selection.js';
import { resolveInstallCredentials } from './install-credential-flow.js';
import { buildMcpConfigInput } from '../core/templates.js';
import type { McpLaunchMode } from '../core/mcp-launch.js';
import { ensureDir, pathExists, writeTextFile } from '../core/file-utils.js';
import { loadManifest, packSourcePaths, resolvePacks, skillsRoot, type SkillManifest } from '../core/manifest.js';
import { mergeJsonMcpConfig, mergeTomlMcpConfig } from '../core/config-writer.js';
import { type RegistryInstall, upsertInstall } from '../core/registry.js';
import { redact } from '../core/redaction.js';
import {
  canUseInteractivePrompts,
  confirmInstall,
  printInstallIntro,
  printInstallSummary
} from '../cli-ui/prompts.js';

export interface InstallOptions {
  agent?: InstallAgentSelector;
  packs?: string;
  dryRun?: boolean;
  mcpConfig?: boolean;
  json?: boolean;
  emit?: boolean;
  homeDir?: string;
  projectDir?: string;
  baseUrl?: string;
  apiToken?: string;
  skipCredentials?: boolean;
  usePlaceholders?: boolean;
  noInteractive?: boolean;
  antigravityScopes?: string;
}

export interface InstallResult {
  agent: AgentName;
  ok: true;
  packs: string[];
  targets: RegistryInstall['targets'];
  dryRun: boolean;
  credentialsConfigured?: boolean;
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
  credentialsConfigured: boolean;
  results: Array<InstallResult | FailedInstallResult>;
}

const require = createRequire(import.meta.url);

async function packageVersion(): Promise<string> {
  const packageJson = require('../../package.json') as { version: string };
  return packageJson.version;
}

function parseAntigravityScopes(value?: string) {
  if (!value) return undefined;
  const scopes = value.split(',').map((item) => item.trim()).filter(Boolean);
  const allowed = new Set(['workspace', 'global', 'shared']);
  for (const scope of scopes) {
    if (!allowed.has(scope)) throw new Error(`Invalid antigravity scope: ${scope}`);
  }
  return scopes as Array<'workspace' | 'global' | 'shared'>;
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

async function writeSkillFiles(baseDir: string, packs: string[], dryRun: boolean): Promise<string[]> {
  const root = skillsRoot();
  const sources = await packSourcePaths(packs, root);
  const planned: string[] = [];
  for (const source of sources) {
    const packName = basename(source);
    const destination = join(baseDir, packName, 'SKILL.md');
    planned.push(`${packName} -> ${destination}`);
    if (dryRun) continue;
    await ensureDir(dirname(destination));
    await cp(join(source, 'SKILL.md'), destination);
  }
  return planned;
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

async function writeSkillTargets(
  adapter: AgentAdapter,
  skillTargets: InstallTarget[],
  packs: string[],
  manifest: SkillManifest,
  dryRun: boolean
): Promise<string[]> {
  const planned: string[] = [];
  for (const target of skillTargets) {
    if (target.mode === 'cursor-rules') {
      planned.push(...await writeCursorRules(target, packs, manifest, dryRun));
    } else if (target.mode === 'skill-file') {
      planned.push(...await writeSkillFiles(target.path, packs, dryRun));
    } else {
      planned.push(...await copyPacks(target, packs, dryRun));
    }
  }
  return planned;
}

async function mergeMcpTarget(
  mcpTarget: InstallTarget,
  launchMode: McpLaunchMode,
  adapter: AgentAdapter,
  options: InstallOptions,
  messages: string[]
): Promise<void> {
  const mcpInput = buildMcpConfigInput({
    mode: launchMode,
    homeDir: options.homeDir
  });
  if (mcpTarget.mode === 'manual') {
    messages.push(`Manual MCP config required for ${mcpTarget.path}`);
    messages.push(await adapter.renderMcpConfig(mcpInput));
    return;
  }
  if (mcpTarget.mode === 'toml-merge') {
    const result = await mergeTomlMcpConfig(mcpTarget.path, mcpInput, Boolean(options.dryRun));
    messages.push(result.message);
    return;
  }
  if (mcpTarget.mode === 'json-merge') {
    const result = await mergeJsonMcpConfig(mcpTarget.path, mcpInput, Boolean(options.dryRun));
    messages.push(result.message);
  }
}

async function installOne(
  adapter: AgentAdapter,
  options: InstallOptions,
  manifest: SkillManifest,
  packs: string[],
  launchMode: McpLaunchMode,
  credentialsConfigured: boolean,
  antigravityScopes?: ReturnType<typeof parseAntigravityScopes>
): Promise<{ result: InstallResult; messages: string[] }> {
  const context = createContext(options.homeDir, options.projectDir, antigravityScopes);
  const skillTargets = await adapter.getSkillTargets(context);
  const copied = await writeSkillTargets(adapter, skillTargets, packs, manifest, Boolean(options.dryRun));
  const targets: RegistryInstall['targets'] = skillTargets.map((target) => ({ type: 'skill' as const, path: target.path }));
  const messages = [`Agent: ${adapter.displayName}`, `Packs: ${packs.join(', ')}`];
  messages.push(...copied.map((item) => `${options.dryRun ? 'Would write' : 'Wrote'} ${item}`));

  if (options.mcpConfig !== false) {
    const mcpTargets: InstallTarget[] = adapter.name === 'antigravity'
      ? antigravityMcpTargets(resolveAntigravityScopes(context), context)
      : [await adapter.getMcpConfigTarget(context)].filter(Boolean) as InstallTarget[];

    for (const mcpTarget of mcpTargets) {
      targets.push({ type: 'mcp-config', path: mcpTarget.path });
      await mergeMcpTarget(mcpTarget, launchMode, adapter, options, messages);
    }
  }

  if (adapter.name === 'cursor' && launchMode === 'placeholder') {
    messages.push('Cursor: dùng credentials wrapper hoặc credentials.env để tránh commit token.');
  }

  if (!credentialsConfigured && launchMode === 'placeholder') {
    messages.push('Next: chạy lại install với URL/token hoặc chỉnh ~/.config/kkauto-skill/credentials.env');
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

  return {
    result: {
      agent: adapter.name,
      ok: true,
      packs,
      targets,
      dryRun: Boolean(options.dryRun),
      credentialsConfigured
    },
    messages
  };
}

export async function runInstall(options: InstallOptions): Promise<InstallResult | MultiInstallResult> {
  const selector = options.agent ?? 'auto';
  const interactive = canUseInteractivePrompts(options.json) && !options.noInteractive;
  if (interactive && !options.json) {
    printInstallIntro((require('../../package.json') as { version: string }).version);
  }

  const scopeOverride = parseAntigravityScopes(options.antigravityScopes);
  const selection = await resolveInstallAgents({
    selector,
    json: options.json,
    noInteractive: options.noInteractive,
    homeDir: options.homeDir,
    projectDir: options.projectDir
  });

  if (scopeOverride && !selection.antigravityScopes) {
    selection.antigravityScopes = scopeOverride;
  }

  const credentialResult = options.mcpConfig === false
    ? { launchMode: 'placeholder' as const, credentialsConfigured: false }
    : await resolveInstallCredentials({
      baseUrl: options.baseUrl,
      apiToken: options.apiToken,
      skipCredentials: options.skipCredentials,
      usePlaceholders: options.usePlaceholders,
      noInteractive: options.noInteractive,
      json: options.json,
      dryRun: options.dryRun,
      homeDir: options.homeDir
    });

  const launchMode: McpLaunchMode = credentialResult.launchMode === 'skip'
    ? 'placeholder'
    : credentialResult.launchMode;

  if (interactive && !options.dryRun) {
    const proceed = await confirmInstall(Boolean(options.dryRun));
    if (!proceed) process.exit(0);
  }

  const manifest = await loadManifest();
  const packs = resolvePacks(manifest, options.packs);
  const multi = selector === 'all' || selection.adapters.length > 1;

  if (!multi) {
    const { result, messages } = await installOne(
      selection.adapters[0],
      options,
      manifest,
      packs,
      launchMode,
      credentialResult.credentialsConfigured,
      selection.antigravityScopes ?? scopeOverride
    );
    if (options.emit !== false) {
      if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      else if (!interactive) process.stdout.write(`${messages.join('\n')}\n`);
      else printInstallSummary([{ agent: result.agent, ok: true }]);
    }
    return result;
  }

  const results: MultiInstallResult['results'] = [];
  for (const adapter of selection.adapters) {
    try {
      const scopes = adapter.name === 'antigravity'
        ? (selection.antigravityScopes ?? scopeOverride)
        : undefined;
      const { result } = await installOne(
        adapter,
        options,
        manifest,
        packs,
        launchMode,
        credentialResult.credentialsConfigured,
        scopes
      );
      results.push(result);
    } catch (error) {
      const message = redact(error instanceof Error ? error.message : String(error));
      results.push({ agent: adapter.name, ok: false, error: message, dryRun: Boolean(options.dryRun) });
    }
  }

  const result: MultiInstallResult = {
    selector,
    dryRun: Boolean(options.dryRun),
    credentialsConfigured: credentialResult.credentialsConfigured,
    results
  };

  if (options.emit !== false) {
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else if (!interactive) {
      process.stdout.write(results.map((item) => (item.ok ? `${item.agent}: OK` : `${item.agent}: ${item.error}`)).join('\n'));
      process.stdout.write('\n');
    } else {
      printInstallSummary(results.map((item) => ({
        agent: item.agent,
        ok: item.ok,
        error: item.ok ? undefined : item.error
      })));
    }
  }

  if (results.some((item) => !item.ok)) throw new Error('One or more agent installs failed.');
  return result;
}

export async function hasInstalledConfig(path: string): Promise<boolean> {
  return pathExists(path);
}
