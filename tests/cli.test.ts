import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

function execCli(args: string[], env?: NodeJS.ProcessEnv) {
  return execFileAsync('node', ['dist/cli.js', ...args], { env: { ...process.env, ...env } });
}

describe('compiled CLI behavior', () => {
  it('prints a JSON envelope for print-config --json', async () => {
    const { stdout } = await execCli(['print-config', '--agent', 'codex', '--json']);
    const parsed = JSON.parse(stdout);
    expect(parsed.agent).toBe('codex');
    expect(parsed.format).toBe('toml');
    expect(parsed.config).toContain('[mcp_servers.kkauto]');
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
});
