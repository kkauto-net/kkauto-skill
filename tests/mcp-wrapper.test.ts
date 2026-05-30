import { mkdtemp, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  mergeCredentialsInput,
  readCredentials,
  validateBaseUrl,
  writeCredentials
} from '../src/core/credentials.js';
import { buildMcpConfigInput, usesCredentialsWrapper } from '../src/core/mcp-launch.js';
import { mergeJsonMcpConfig } from '../src/core/config-writer.js';

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
});
