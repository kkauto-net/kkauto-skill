import { chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { PACKAGE_NAME, BASE_URL_PLACEHOLDER, TOKEN_PLACEHOLDER } from '../constants.js';
import { ensureDir, pathExists, readTextIfExists, writeTextFile } from './file-utils.js';

export type AntigravityScope = 'workspace' | 'global' | 'shared';

export interface CredentialsData {
  KK_API_BASE_URL: string;
  KK_API_TOKEN: string;
  KK_MCP_ENABLE_DELETE?: string;
  KK_MCP_DEFAULT_STATUS?: string;
  KK_MCP_MAX_LIST_LIMIT?: string;
}

export interface CredentialsResolveOptions {
  baseUrl?: string;
  apiToken?: string;
  skipCredentials?: boolean;
  usePlaceholders?: boolean;
  interactive?: boolean;
  homeDir?: string;
}

export interface CredentialsResolveResult {
  mode: 'wrapper' | 'placeholder' | 'skip';
  data?: CredentialsData;
  credentialsPath?: string;
}

export function credentialsPath(homeDir = homedir()): string {
  return join(homeDir, '.config', PACKAGE_NAME, 'credentials.env');
}

function parseDotEnv(content: string): CredentialsData | null {
  const data: Partial<CredentialsData> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key in { KK_API_BASE_URL: 1, KK_API_TOKEN: 1, KK_MCP_ENABLE_DELETE: 1, KK_MCP_DEFAULT_STATUS: 1, KK_MCP_MAX_LIST_LIMIT: 1 }) {
      (data as Record<string, string>)[key] = value;
    }
  }
  if (!data.KK_API_BASE_URL || !data.KK_API_TOKEN) return null;
  return data as CredentialsData;
}

export async function readCredentials(homeDir?: string): Promise<CredentialsData | null> {
  const raw = await readTextIfExists(credentialsPath(homeDir));
  if (!raw) return null;
  return parseDotEnv(raw);
}

function serializeCredentials(data: CredentialsData): string {
  const lines = [
    `KK_API_BASE_URL=${data.KK_API_BASE_URL}`,
    `KK_API_TOKEN=${data.KK_API_TOKEN}`
  ];
  if (data.KK_MCP_ENABLE_DELETE !== undefined) lines.push(`KK_MCP_ENABLE_DELETE=${data.KK_MCP_ENABLE_DELETE}`);
  if (data.KK_MCP_DEFAULT_STATUS !== undefined) lines.push(`KK_MCP_DEFAULT_STATUS=${data.KK_MCP_DEFAULT_STATUS}`);
  if (data.KK_MCP_MAX_LIST_LIMIT !== undefined) lines.push(`KK_MCP_MAX_LIST_LIMIT=${data.KK_MCP_MAX_LIST_LIMIT}`);
  return `${lines.join('\n')}\n`;
}

export async function writeCredentials(data: CredentialsData, homeDir?: string, dryRun = false): Promise<string> {
  const path = credentialsPath(homeDir);
  if (dryRun) return path;
  await ensureDir(join(path, '..'));
  await writeTextFile(path, serializeCredentials(data));
  await chmod(path, 0o600);
  return path;
}

export function isPlaceholderCredentials(data: CredentialsData): boolean {
  return data.KK_API_TOKEN === TOKEN_PLACEHOLDER || data.KK_API_BASE_URL === BASE_URL_PLACEHOLDER;
}

export function validateBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function inspectCredentialsFile(homeDir?: string): Promise<{
  exists: boolean;
  modeOk: boolean;
  hasBaseUrl: boolean;
  hasToken: boolean;
  usesPlaceholder: boolean;
  path: string;
}> {
  const path = credentialsPath(homeDir);
  const exists = await pathExists(path);
  if (!exists) {
    return { exists: false, modeOk: false, hasBaseUrl: false, hasToken: false, usesPlaceholder: false, path };
  }
  const data = await readCredentials(homeDir);
  return {
    exists: true,
    modeOk: true,
    hasBaseUrl: Boolean(data?.KK_API_BASE_URL),
    hasToken: Boolean(data?.KK_API_TOKEN),
    usesPlaceholder: data ? isPlaceholderCredentials(data) : false,
    path
  };
}

export function mergeCredentialsInput(
  existing: CredentialsData | null,
  input: { baseUrl?: string; apiToken?: string; optionalEnv?: Partial<CredentialsData> }
): CredentialsData {
  return {
    KK_API_BASE_URL: input.baseUrl ?? existing?.KK_API_BASE_URL ?? BASE_URL_PLACEHOLDER,
    KK_API_TOKEN: input.apiToken ?? existing?.KK_API_TOKEN ?? TOKEN_PLACEHOLDER,
    KK_MCP_ENABLE_DELETE: input.optionalEnv?.KK_MCP_ENABLE_DELETE ?? existing?.KK_MCP_ENABLE_DELETE ?? 'false',
    KK_MCP_DEFAULT_STATUS: input.optionalEnv?.KK_MCP_DEFAULT_STATUS ?? existing?.KK_MCP_DEFAULT_STATUS ?? '0',
    KK_MCP_MAX_LIST_LIMIT: input.optionalEnv?.KK_MCP_MAX_LIST_LIMIT ?? existing?.KK_MCP_MAX_LIST_LIMIT ?? '50'
  };
}

export async function resolveCredentialsMode(
  options: CredentialsResolveOptions & { data?: CredentialsData }
): Promise<CredentialsResolveResult> {
  if (options.usePlaceholders) {
    return { mode: 'placeholder' };
  }
  if (options.skipCredentials) {
    const existing = await readCredentials(options.homeDir);
    if (existing && !isPlaceholderCredentials(existing)) {
      return { mode: 'wrapper', data: existing, credentialsPath: credentialsPath(options.homeDir) };
    }
    return { mode: 'skip' };
  }
  if (options.data) {
    const path = await writeCredentials(options.data, options.homeDir, false);
    return { mode: 'wrapper', data: options.data, credentialsPath: path };
  }
  const existing = await readCredentials(options.homeDir);
  if (existing && !isPlaceholderCredentials(existing)) {
    return { mode: 'wrapper', data: existing, credentialsPath: credentialsPath(options.homeDir) };
  }
  return { mode: 'placeholder' };
}
