import * as TOML from '@iarna/toml';
import { dirname } from 'node:path';
import { mkdir } from 'node:fs/promises';
import type { McpConfigInput } from '../agents/types.js';
import { backupIfExists } from './backups.js';
import { readTextIfExists, writeTextFile } from './file-utils.js';

type TomlValue = Parameters<typeof TOML.stringify>[0];

export interface WriteResult {
  path: string;
  changed: boolean;
  backupPath: string | null;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function serverObject(input: McpConfigInput, existing?: unknown): Record<string, unknown> {
  if (input.launchMode === 'wrapper') {
    return {
      command: input.command,
      args: input.args
    };
  }
  const existingServer = isRecord(existing) ? existing : {};
  const existingEnv = isRecord(existingServer.env) ? existingServer.env : {};
  const inputEnv = input.env ?? {};
  return {
    ...existingServer,
    command: input.command,
    args: input.args,
    env: { ...inputEnv, ...existingEnv }
  };
}

export async function mergeJsonMcpConfig(path: string, input: McpConfigInput, dryRun = false): Promise<WriteResult> {
  const raw = await readTextIfExists(path);
  const current = raw ? JSON.parse(raw) as Record<string, unknown> : {};
  const mcpServers = isRecord(current.mcpServers) ? current.mcpServers : {};
  current.mcpServers = { ...mcpServers, [input.serverName]: serverObject(input, mcpServers[input.serverName]) };
  if (dryRun) return { path, changed: true, backupPath: null, message: 'Would merge MCP JSON config.' };
  await mkdir(dirname(path), { recursive: true });
  const backupPath = await backupIfExists(path);
  await writeTextFile(path, `${JSON.stringify(current, null, 2)}\n`);
  return { path, changed: true, backupPath, message: 'Merged MCP JSON config.' };
}

export async function mergeTomlMcpConfig(path: string, input: McpConfigInput, dryRun = false): Promise<WriteResult> {
  const raw = await readTextIfExists(path);
  const current = raw ? TOML.parse(raw) as Record<string, unknown> : {};
  const servers = isRecord(current.mcp_servers) ? current.mcp_servers : {};
  current.mcp_servers = { ...servers, [input.serverName]: serverObject(input, servers[input.serverName]) };
  if (dryRun) return { path, changed: true, backupPath: null, message: 'Would merge Codex TOML config.' };
  await mkdir(dirname(path), { recursive: true });
  const backupPath = await backupIfExists(path);
  await writeTextFile(path, TOML.stringify(current as TomlValue));
  return { path, changed: true, backupPath, message: 'Merged Codex TOML config.' };
}
