import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { mergeJsonMcpConfig, mergeTomlMcpConfig } from '../src/core/config-writer.js';
import { defaultMcpInput } from '../src/core/templates.js';

describe('config writer', () => {
  it('preserves unknown JSON fields', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-json-'));
    const path = join(dir, 'mcp_config.json');
    await writeFile(path, JSON.stringify({ keep: true, mcpServers: { other: { command: 'x' } } }), 'utf8');
    await mergeJsonMcpConfig(path, defaultMcpInput());
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    expect(parsed.keep).toBe(true);
    expect(parsed.mcpServers.other.command).toBe('x');
    expect(parsed.mcpServers.kkauto.command).toBe('npx');
  });

  it('preserves existing kkauto JSON env secrets', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-json-secret-'));
    const path = join(dir, 'mcp_config.json');
    await writeFile(path, JSON.stringify({ mcpServers: { kkauto: { env: { KK_API_TOKEN: 'real-token', EXTRA: 'keep' } } } }), 'utf8');
    await mergeJsonMcpConfig(path, defaultMcpInput());
    const parsed = JSON.parse(await readFile(path, 'utf8'));
    expect(parsed.mcpServers.kkauto.env.KK_API_TOKEN).toBe('real-token');
    expect(parsed.mcpServers.kkauto.env.EXTRA).toBe('keep');
  });

  it('merges Codex TOML config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-toml-'));
    const path = join(dir, 'config.toml');
    await writeFile(path, 'model = "gpt"\n', 'utf8');
    await mergeTomlMcpConfig(path, defaultMcpInput());
    const content = await readFile(path, 'utf8');
    expect(content).toContain('model = "gpt"');
    expect(content).toContain('[mcp_servers.kkauto]');
  });

  it('preserves existing kkauto TOML env secrets', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kkauto-toml-secret-'));
    const path = join(dir, 'config.toml');
    await writeFile(path, '[mcp_servers.kkauto]\ncommand = "old"\n[mcp_servers.kkauto.env]\nKK_API_TOKEN = "real-token"\n', 'utf8');
    await mergeTomlMcpConfig(path, defaultMcpInput());
    const content = await readFile(path, 'utf8');
    expect(content).toContain('KK_API_TOKEN = "real-token"');
    expect(content).toContain('command = "npx"');
  });
});
