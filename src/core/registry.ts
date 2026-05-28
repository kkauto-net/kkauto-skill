import { join } from 'node:path';
import { homedir } from 'node:os';
import { PACKAGE_NAME, REGISTRY_VERSION } from '../constants.js';
import type { AgentName } from '../agents/types.js';
import { readTextIfExists, writeTextFile } from './file-utils.js';

export interface RegistryTarget {
  type: 'skill' | 'mcp-config';
  path: string;
}

export interface RegistryInstall {
  agent: AgentName;
  installedAt: string;
  updatedAt: string;
  packageVersion: string;
  packs: string[];
  targets: RegistryTarget[];
}

export interface InstallRegistry {
  schemaVersion: number;
  installs: RegistryInstall[];
}

export function registryPath(homeDir = homedir()): string {
  return join(homeDir, '.config', PACKAGE_NAME, 'registry.json');
}

export async function readRegistry(homeDir?: string): Promise<InstallRegistry> {
  const raw = await readTextIfExists(registryPath(homeDir));
  if (!raw) return { schemaVersion: REGISTRY_VERSION, installs: [] };
  return JSON.parse(raw) as InstallRegistry;
}

export async function writeRegistry(registry: InstallRegistry, homeDir?: string): Promise<void> {
  await writeTextFile(registryPath(homeDir), `${JSON.stringify(registry, null, 2)}\n`);
}

export async function upsertInstall(install: RegistryInstall, homeDir?: string): Promise<void> {
  const registry = await readRegistry(homeDir);
  const index = registry.installs.findIndex((item) => item.agent === install.agent);
  if (index >= 0) registry.installs[index] = install;
  else registry.installs.push(install);
  await writeRegistry(registry, homeDir);
}
