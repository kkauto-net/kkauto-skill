import { runInstall } from './install.js';
import { readRegistry } from '../core/registry.js';
import type { InstallResult } from './install.js';
import type { RegistryInstall } from '../core/registry.js';

function cursorProjectDir(install: RegistryInstall): string | undefined {
  const cursorTarget = install.targets.find((target) => /(^|[/\\])\.cursor([/\\]|$)/.test(target.path));
  return cursorTarget?.path.split(/[/\\]\.cursor[/\\]?/)[0];
}

export interface UpdateOptions {
  dryRun?: boolean;
  json?: boolean;
  homeDir?: string;
  emit?: boolean;
}

export async function runUpdate(options: UpdateOptions): Promise<void> {
  const registry = await readRegistry(options.homeDir);
  if (registry.installs.length === 0) {
    if (options.emit !== false) {
      if (options.json) process.stdout.write(`${JSON.stringify({ installs: [], message: 'No installs found. Run kkauto-skill install first.' }, null, 2)}\n`);
      else process.stdout.write('No installs found. Run kkauto-skill install first.\n');
    }
    return;
  }
  if (options.json) {
    const installs: InstallResult[] = [];
    for (const install of registry.installs) {
      installs.push(await runInstall({ agent: install.agent, packs: install.packs.join(','), dryRun: options.dryRun, json: true, emit: false, homeDir: options.homeDir, projectDir: cursorProjectDir(install) }) as InstallResult);
    }
    if (options.emit !== false) process.stdout.write(`${JSON.stringify({ installs }, null, 2)}\n`);
    return;
  }
  for (const install of registry.installs) {
    await runInstall({ agent: install.agent, packs: install.packs.join(','), dryRun: options.dryRun, emit: options.emit, homeDir: options.homeDir, projectDir: cursorProjectDir(install) });
  }
}
