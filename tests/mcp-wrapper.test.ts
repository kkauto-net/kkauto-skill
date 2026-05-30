import { execFile } from 'node:child_process';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import {
  mergeCredentialsInput,
  readCredentials,
  validateBaseUrl,
  writeCredentials
} from '../src/core/credentials.js';
import { buildMcpConfigInput, credentialsShellExportScript, usesCredentialsWrapper } from '../src/core/mcp-launch.js';
import { mergeJsonMcpConfig, mergeTomlMcpConfig } from '../src/core/config-writer.js';

const execFileAsync = promisify(execFile);

describe('credential store', () => {
  it('writes and reads env file', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-store-'));
    await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: 'sample-value-for-test'
    }, homeDir);
    const data = await readCredentials(homeDir);
    expect(data?.KK_API_BASE_URL).toBe('https://tenant.example.com');
    expect(data?.KK_API_TOKEN).toBe('sample-value-for-test');
  });

  it('reads credential values literally like the launch wrapper', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-store-literal-'));
    await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com/path?x=1',
      KK_API_TOKEN: 'token with spaces and "quotes"'
    }, homeDir);
    const data = await readCredentials(homeDir);
    expect(data?.KK_API_BASE_URL).toBe('https://tenant.example.com/path?x=1');
    expect(data?.KK_API_TOKEN).toBe('token with spaces and "quotes"');
  });

  it('writes env file with owner-only permissions', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-store-mode-'));
    const path = await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: 'sample-value-for-test'
    }, homeDir);
    const mode = (await stat(path)).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('rejects multi-line credential values', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-store-invalid-'));
    await expect(writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: 'token\nKK_MCP_ENABLE_DELETE=true'
    }, homeDir)).rejects.toThrow('single-line value');
  });

  it('validates base URLs', () => {
    expect(validateBaseUrl('https://tenant.example.com')).toBe(true);
    expect(validateBaseUrl('not-a-url')).toBe(false);
  });

  it('merges partial updates', () => {
    const merged = mergeCredentialsInput(
      { KK_API_BASE_URL: 'https://old.example.com', KK_API_TOKEN: 'keep-me' },
      { baseUrl: 'https://new.example.com' }
    );
    expect(merged.KK_API_BASE_URL).toBe('https://new.example.com');
    expect(merged.KK_API_TOKEN).toBe('keep-me');
  });
});

describe('wrapper MCP config', () => {
  it('does not inline secrets in JSON merge', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-wrap-'));
    await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: 'secret-inline-should-not-appear'
    }, homeDir);
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-wrap-json-'));
    const path = join(dir, 'mcp.json');
    const input = buildMcpConfigInput({ mode: 'wrapper', homeDir });
    await mergeJsonMcpConfig(path, input);
    const content = await readFile(path, 'utf8');
    expect(content).not.toContain('secret-inline-should-not-appear');
    expect(content).toContain('credentials.env');
    expect(usesCredentialsWrapper(content)).toBe(true);
  });

  it('does not inline secrets in TOML merge', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-wrap-toml-home-'));
    await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: 'sentinel-token-for-wrapper-test'
    }, homeDir);
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-wrap-toml-'));
    const path = join(dir, 'config.toml');
    const input = buildMcpConfigInput({ mode: 'wrapper', homeDir });
    await mergeTomlMcpConfig(path, input);
    const content = await readFile(path, 'utf8');
    expect(content).not.toContain('sentinel-token-for-wrapper-test');
    expect(content).toContain('credentials.env');
    expect(usesCredentialsWrapper(content)).toBe(true);
  });

  it('exports credential values without evaluating shell metacharacters', async () => {
    const homeDir = await mkdtemp(join(tmpdir(), 'kkauto-wrap-shell-'));
    const path = await writeCredentials({
      KK_API_BASE_URL: 'https://tenant.example.com',
      KK_API_TOKEN: '$(printf injected);`printf bad`;${HOME};a b;c&d|e'
    }, homeDir);
    const script = credentialsShellExportScript(path);
    const { stdout } = await execFileAsync('bash', ['-lc', `${script}; printf '%s' "$KK_API_TOKEN"`]);
    expect(script).not.toContain('source ');
    expect(stdout).toBe('$(printf injected);`printf bad`;${HOME};a b;c&d|e');
  });
});
