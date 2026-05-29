import { describe, expect, it } from 'vitest';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { opencodeAdapter } from '../src/agents/opencode.js';
import { cursorAdapter } from '../src/agents/cursor.js';
import { runInstall } from '../src/commands/install.js';

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
});
