import { describe, expect, it } from 'vitest';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { opencodeAdapter } from '../src/agents/opencode.js';
import { cursorAdapter } from '../src/agents/cursor.js';
import { runInstall } from '../src/commands/install.js';
import { supportedAgents } from '../src/agents/index.js';
import type { AgentName } from '../src/agents/types.js';
import { readRegistry } from '../src/core/registry.js';

async function makeTempContext(prefix: string) {
  return {
    homeDir: await mkdtemp(join(tmpdir(), `${prefix}-home-`)),
    projectDir: await mkdtemp(join(tmpdir(), `${prefix}-project-`))
  };
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, any>;
}

async function expectPlaceholderJsonMcp(path: string) {
  const parsed = await readJson(path);
  expect(parsed.mcpServers.kkauto.command).toBe('npx');
  expect(parsed.mcpServers.kkauto.args).toContain('kkauto-mcp');
  expect(parsed.mcpServers.kkauto.env.KK_API_BASE_URL).toBe('https://your-tenant.example.com');
  expect(parsed.mcpServers.kkauto.env.KK_API_TOKEN).toBe('paste-token-here');
  return parsed;
}

async function expectPlaceholderTomlMcp(path: string) {
  const content = await readFile(path, 'utf8');
  expect(content).toContain('[mcp_servers.kkauto]');
  expect(content).toContain('command = "npx"');
  expect(content).toContain('kkauto-mcp');
  expect(content).toContain('KK_API_BASE_URL = "https://your-tenant.example.com"');
  expect(content).toContain('KK_API_TOKEN = "paste-token-here"');
  return content;
}

async function expectRegistryAgent(homeDir: string, agent: AgentName) {
  const registry = await readRegistry(homeDir);
  const install = registry.installs.find((item) => item.agent === agent);
  expect(install).toBeDefined();
  expect(install?.targets.some((target) => target.type === 'skill')).toBe(true);
  expect(install?.targets.some((target) => target.type === 'mcp-config')).toBe(true);
  return install;
}

describe('install targets', () => {
  it('uses mocked home directory for OpenCode targets', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-home-'));
    const targets = await opencodeAdapter.getSkillTargets({ homeDir });
    expect(targets[0].path).toContain(homeDir);
    expect(targets[0].path).toContain('opencode');
  });

  it('uses project directory for Cursor targets', async () => {
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-cursor-project-'));
    const targets = await cursorAdapter.getSkillTargets({ homeDir: '/tmp/home', projectDir });
    const mcpTarget = await cursorAdapter.getMcpConfigTarget({ homeDir: '/tmp/home', projectDir });
    expect(targets[0].path).toBe(join(projectDir, '.cursor', 'rules'));
    expect(mcpTarget.path).toBe(join(projectDir, '.cursor', 'mcp.json'));
  });

  it('generates Cursor rule files and preserves unrelated MCP servers', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cursor-home-'));
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-cursor-install-'));
    await mkdir(join(projectDir, '.cursor'), { recursive: true });
    await mkdir(join(projectDir, '.cursor', 'rules'), { recursive: true });
    await writeFile(join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: { other: { command: 'tool' } } }), 'utf8');
    await writeFile(join(projectDir, '.cursor', 'rules', 'kkauto-stale.mdc'), 'stale', 'utf8');
    await writeFile(join(projectDir, '.cursor', 'rules', 'user-rule.mdc'), 'keep', 'utf8');
    const result = await runInstall({ agent: 'cursor', packs: 'core', emit: false, homeDir, projectDir });
    expect(result.agent).toBe('cursor');
    const rule = await readFile(join(projectDir, '.cursor', 'rules', 'kkauto-core.mdc'), 'utf8');
    expect(rule).toContain('alwaysApply: false');
    expect(rule).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    const mcp = JSON.parse(await readFile(join(projectDir, '.cursor', 'mcp.json'), 'utf8'));
    expect(mcp.mcpServers.other.command).toBe('tool');
    expect(mcp.mcpServers.kkauto.args).toContain('kkauto-mcp');
    await expect(access(join(projectDir, '.cursor', 'rules', 'kkauto-stale.mdc'))).rejects.toThrow();
    expect(await readFile(join(projectDir, '.cursor', 'rules', 'user-rule.mdc'), 'utf8')).toBe('keep');
  });

  it('installs Claude skills, MCP config, and registry entries', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-claude-install');
    await mkdir(join(homeDir, '.claude'), { recursive: true });
    await writeFile(join(homeDir, '.claude', '.mcp.json'), JSON.stringify({ keep: true, mcpServers: { other: { command: 'tool' } } }), 'utf8');

    const result = await runInstall({ agent: 'claude', packs: 'core', homeDir, projectDir, usePlaceholders: true, noInteractive: true, emit: false });

    expect(result.agent).toBe('claude');
    const skill = await readFile(join(homeDir, '.claude', 'skills', 'kkauto', 'core', 'SKILL.md'), 'utf8');
    expect(skill).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    const mcp = await expectPlaceholderJsonMcp(join(homeDir, '.claude', '.mcp.json'));
    expect(mcp.keep).toBe(true);
    expect(mcp.mcpServers.other.command).toBe('tool');
    await expectRegistryAgent(homeDir, 'claude');
  });

  it('installs OpenCode skills, MCP config, and registry entries', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-opencode-install');
    await mkdir(join(homeDir, '.config', 'opencode'), { recursive: true });
    await writeFile(join(homeDir, '.config', 'opencode', 'opencode.json'), JSON.stringify({ keep: true, mcpServers: { other: { command: 'tool' } } }), 'utf8');

    const result = await runInstall({ agent: 'opencode', packs: 'core', homeDir, projectDir, usePlaceholders: true, noInteractive: true, emit: false });

    expect(result.agent).toBe('opencode');
    const skill = await readFile(join(homeDir, '.config', 'opencode', 'skills', 'kkauto', 'core', 'SKILL.md'), 'utf8');
    expect(skill).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    const mcp = await expectPlaceholderJsonMcp(join(homeDir, '.config', 'opencode', 'opencode.json'));
    expect(mcp.keep).toBe(true);
    expect(mcp.mcpServers.other.command).toBe('tool');
    await expectRegistryAgent(homeDir, 'opencode');
  });

  it('installs Codex skills, TOML MCP config, and registry entries', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-codex-install');
    await mkdir(join(homeDir, '.codex'), { recursive: true });
    await writeFile(join(homeDir, '.codex', 'config.toml'), 'model = "gpt"\n', 'utf8');
    const result = await runInstall({ agent: 'codex', packs: 'core', homeDir, projectDir, usePlaceholders: true, noInteractive: true, emit: false });

    expect(result.agent).toBe('codex');
    const skill = await readFile(join(homeDir, '.codex', 'skills', 'kkauto', 'core', 'SKILL.md'), 'utf8');
    expect(skill).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    const mcp = await expectPlaceholderTomlMcp(join(homeDir, '.codex', 'config.toml'));
    expect(mcp).toContain('model = "gpt"');
    await expectRegistryAgent(homeDir, 'codex');
  });

  it('installs Antigravity global skills, MCP config, and registry entries', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-antigravity-install');
    await mkdir(join(homeDir, '.gemini', 'config'), { recursive: true });
    await writeFile(join(homeDir, '.gemini', 'config', 'mcp_config.json'), JSON.stringify({ keep: true, mcpServers: { other: { command: 'tool' } } }), 'utf8');

    const result = await runInstall({ agent: 'antigravity', packs: 'core', homeDir, projectDir, usePlaceholders: true, noInteractive: true, emit: false });

    expect(result.agent).toBe('antigravity');
    const skill = await readFile(join(homeDir, '.gemini', 'antigravity-cli', 'skills', 'core', 'SKILL.md'), 'utf8');
    expect(skill).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    const mcp = await expectPlaceholderJsonMcp(join(homeDir, '.gemini', 'config', 'mcp_config.json'));
    expect(mcp.keep).toBe(true);
    expect(mcp.mcpServers.other.command).toBe('tool');
    await expectRegistryAgent(homeDir, 'antigravity');
  });

  it('installs Cursor rules, MCP config, and project-local registry entries', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-cursor-matrix-install');
    await mkdir(join(projectDir, '.cursor'), { recursive: true });
    await writeFile(join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({ keep: true, mcpServers: { other: { command: 'tool' } } }), 'utf8');

    const result = await runInstall({ agent: 'cursor', packs: 'core', homeDir, projectDir, usePlaceholders: true, noInteractive: true, emit: false });

    expect(result.agent).toBe('cursor');
    const rule = await readFile(join(projectDir, '.cursor', 'rules', 'kkauto-core.mdc'), 'utf8');
    expect(rule).toContain('alwaysApply: false');
    expect(rule).toContain('Never reveal, log, summarize, or transform `KK_API_TOKEN`');
    expect(rule).not.toContain('name: kk-core');
    const mcp = await expectPlaceholderJsonMcp(join(projectDir, '.cursor', 'mcp.json'));
    expect(mcp.keep).toBe(true);
    expect(mcp.mcpServers.other.command).toBe('tool');
    const install = await expectRegistryAgent(homeDir, 'cursor');
    expect(install?.targets.every((target) => target.path.startsWith(projectDir))).toBe(true);
  });

  it('installs all agents including every Antigravity scope', async () => {
    const { homeDir, projectDir } = await makeTempContext('kkauto-all-install');
    const result = await runInstall({
      agent: 'all',
      packs: 'core',
      homeDir,
      projectDir,
      antigravityScopes: 'workspace,global,shared',
      usePlaceholders: true,
      noInteractive: true,
      emit: false
    });

    expect('selector' in result && result.selector).toBe('all');
    if (!('results' in result)) throw new Error('Expected multi-install result');
    expect(result.results.map((item) => item.agent)).toEqual(supportedAgents);
    expect(result.results.every((item) => item.ok)).toBe(true);

    await expect(access(join(homeDir, '.claude', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.config', 'opencode', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.codex', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.cursor', 'rules', 'kkauto-core.mdc'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.agents', 'skills', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.gemini', 'antigravity-cli', 'skills', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.gemini', 'skills', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.agents', 'mcp_config.json'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.gemini', 'config', 'mcp_config.json'))).resolves.toBeUndefined();

    const registry = await readRegistry(homeDir);
    expect(registry.installs.map((item) => item.agent)).toEqual(supportedAgents);
    const antigravityInstall = registry.installs.find((item) => item.agent === 'antigravity');
    expect(antigravityInstall?.targets.map((target) => target.path).sort()).toEqual([
      join(homeDir, '.gemini', 'antigravity-cli', 'skills'),
      join(homeDir, '.gemini', 'config', 'mcp_config.json'),
      join(homeDir, '.gemini', 'skills'),
      join(projectDir, '.agents', 'mcp_config.json'),
      join(projectDir, '.agents', 'skills')
    ].sort());
  });
});
