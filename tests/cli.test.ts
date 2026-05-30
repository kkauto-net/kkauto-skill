import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';
import packageJson from '../package.json' with { type: 'json' };
import { registryPath } from '../src/core/registry.js';

const execFileAsync = promisify(execFile);
const cliPath = join(process.cwd(), 'dist', 'cli.js');
const sensitiveEnvKeys = [
  'KK_API_BASE_URL',
  'KK_API_TOKEN',
  'KK_MCP_DEFAULT_STATUS',
  'KK_MCP_ENABLE_DELETE',
  'KK_MCP_MAX_LIST_LIMIT'
];

beforeAll(async () => {
  await execFileAsync('npm', ['run', 'build'], { cwd: process.cwd() });
}, 60_000);

function cliEnv(env?: NodeJS.ProcessEnv) {
  const next = { ...process.env, ...env };
  for (const key of sensitiveEnvKeys) {
    if (!env || !(key in env)) {
      delete next[key];
    }
  }
  return next;
}

function execCli(args: string[], env?: NodeJS.ProcessEnv) {
  return execFileAsync('node', [cliPath, ...args], { env: cliEnv(env) });
}

describe('compiled CLI behavior', () => {
  it('prints the package version', async () => {
    const { stdout } = await execCli(['--version']);
    expect(stdout.trim()).toBe(packageJson.version);
  });

  it('prints a JSON envelope for print-config --json', async () => {
    const { stdout } = await execCli(['print-config', '--agent', 'codex', '--json']);
    const parsed = JSON.parse(stdout);
    expect(parsed.agent).toBe('codex');
    expect(parsed.format).toBe('toml');
    expect(parsed.config).toContain('[mcp_servers.kkauto]');
  });

  it('prints Cursor JSON config', async () => {
    const { stdout } = await execCli(['print-config', '--agent', 'cursor', '--json']);
    const parsed = JSON.parse(stdout);
    expect(parsed.agent).toBe('cursor');
    expect(parsed.format).toBe('json');
    expect(JSON.parse(parsed.config).mcpServers.kkauto.args).toContain('kkauto-mcp');
  });

  it('returns a friendly error for unsupported install agents', async () => {
    await expect(execCli(['install', '--agent', 'bad', '--dry-run'])).rejects.toMatchObject({
      stderr: expect.stringContaining('Unsupported agent: bad')
    });
  });

  it('returns a friendly error for unsupported doctor agents', async () => {
    await expect(execCli(['doctor', '--agent', 'bad'])).rejects.toMatchObject({
      stderr: expect.stringContaining('Unsupported agent: bad')
    });
  });

  it('redacts parser errors from config merge failures', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-secret-'));
    const codexDir = join(homeDir, '.codex');
    await mkdir(codexDir, { recursive: true });
    await writeFile(join(codexDir, 'config.toml'), '[mcp_servers.kkauto.env]\nKK_API_TOKEN = "secret-value\n', 'utf8');

    await expect(execCli(['install', '--agent', 'codex', '--packs', 'core'], {
      HOME: homeDir,
      KKAUTO_SKILL_ROOT: process.cwd()
    })).rejects.toMatchObject({
      stderr: expect.not.stringContaining('secret-value')
    });
  });

  it('fails auto non-interactive install with multiple detected agents and suggests all', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-multi-'));
    await mkdir(join(homeDir, '.config', 'opencode'), { recursive: true });
    await mkdir(join(homeDir, '.codex'), { recursive: true });

    await expect(execCli(['install', '--agent', 'auto', '--dry-run', '--json', '--no-interactive'], {
      HOME: homeDir,
      KKAUTO_SKILL_ROOT: process.cwd()
    })).rejects.toMatchObject({
      stderr: expect.stringContaining('--agent all')
    });
  });

  it('returns a multi-install JSON envelope for all detected agents', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-all-'));
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-project-'));
    await mkdir(join(homeDir, '.config', 'opencode'), { recursive: true });
    await mkdir(join(projectDir, '.cursor'), { recursive: true });

    const { stdout } = await execFileAsync('node', [cliPath, 'install', '--agent', 'all', '--dry-run', '--json', '--no-interactive', '--use-placeholders'], {
      cwd: projectDir,
      env: cliEnv({ HOME: homeDir, KKAUTO_SKILL_ROOT: process.cwd() })
    });
    const parsed = JSON.parse(stdout);
    expect(parsed.selector).toBe('all');
    expect(parsed.results.map((item: { agent: string }) => item.agent)).toEqual(['claude', 'opencode', 'codex', 'antigravity', 'cursor']);
    expect(parsed.results.every((item: { ok: boolean }) => item.ok)).toBe(true);
  });

  it('runs install dry-run JSON through the compiled CLI without writing registry', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-dry-home-'));
    const { stdout } = await execCli(['install', '--agent', 'opencode', '--packs', 'fb-posts', '--dry-run', '--json', '--no-interactive', '--use-placeholders'], {
      HOME: homeDir,
      KKAUTO_SKILL_ROOT: process.cwd()
    });
    const parsed = JSON.parse(stdout);
    expect(parsed.agent).toBe('opencode');
    expect(parsed.dryRun).toBe(true);
    expect(parsed.packs).toEqual(['core', 'fb-posts']);
    expect(parsed.targets.some((target: { type: string }) => target.type === 'mcp-config')).toBe(true);
    await expect(access(registryPath(homeDir))).rejects.toThrow();
  });

  it('runs a full multi-agent install through the compiled CLI', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-full-home-'));
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-full-project-'));
    const { stdout } = await execFileAsync('node', [cliPath, 'install', '--agent', 'all', '--packs', 'core', '--json', '--no-interactive', '--use-placeholders'], {
      cwd: projectDir,
      env: cliEnv({
        HOME: homeDir,
        KK_API_BASE_URL: 'https://secret-value.example.com',
        KK_API_TOKEN: 'secret-value',
        KKAUTO_SKILL_ROOT: process.cwd()
      })
    });

    const parsed = JSON.parse(stdout);
    expect(parsed.selector).toBe('all');
    expect(parsed.results.map((item: { agent: string }) => item.agent)).toEqual(['claude', 'opencode', 'codex', 'antigravity', 'cursor']);
    expect(parsed.results.every((item: { ok: boolean }) => item.ok)).toBe(true);
    expect(stdout).not.toContain('secret-value');
    expect(stdout).not.toContain('https://secret-value.example.com');

    await expect(access(join(homeDir, '.claude', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.config', 'opencode', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.codex', 'skills', 'kkauto', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(homeDir, '.gemini', 'antigravity-cli', 'skills', 'core', 'SKILL.md'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.cursor', 'rules', 'kkauto-core.mdc'))).resolves.toBeUndefined();

    const registry = JSON.parse(await readFile(registryPath(homeDir), 'utf8'));
    expect(registry.installs.map((item: { agent: string }) => item.agent)).toEqual(['claude', 'opencode', 'codex', 'antigravity', 'cursor']);

    const opencodeConfig = await readFile(join(homeDir, '.config', 'opencode', 'opencode.json'), 'utf8');
    expect(opencodeConfig).toContain('paste-token-here');
    expect(opencodeConfig).not.toContain('secret-value');
    expect(opencodeConfig).not.toContain('https://secret-value.example.com');
  });

  it('replays registry installs through the compiled update command', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-update-home-'));
    const projectDir = await mkdtemp(join(tmpdir(), 'kkauto-cli-update-project-'));
    await execFileAsync('node', [cliPath, 'install', '--agent', 'cursor', '--packs', 'core', '--json', '--no-interactive', '--use-placeholders'], {
      cwd: projectDir,
      env: cliEnv({ HOME: homeDir, KKAUTO_SKILL_ROOT: process.cwd() })
    });

    const { stdout } = await execFileAsync('node', [cliPath, 'update', '--dry-run', '--json', '--use-placeholders'], {
      cwd: await mkdtemp(join(tmpdir(), 'kkauto-cli-update-other-project-')),
      env: cliEnv({ HOME: homeDir, KKAUTO_SKILL_ROOT: process.cwd() })
    });
    const parsed = JSON.parse(stdout);
    expect(parsed.installs).toHaveLength(1);
    expect(parsed.installs[0].agent).toBe('cursor');
    expect(parsed.installs[0].dryRun).toBe(true);
    expect(parsed.installs[0].targets.some((target: { path: string }) => target.path.startsWith(projectDir))).toBe(true);
  });
});
