import { runInstall } from './install.js';
import { readRegistry } from '../core/registry.js';

export interface UpdateOptions {
  dryRun?: boolean;
  json?: boolean;
}

export async function runUpdate(options: UpdateOptions): Promise<void> {
  const registry = await readRegistry();
  if (registry.installs.length === 0) {
    if (options.json) process.stdout.write(`${JSON.stringify({ installs: [], message: 'No installs found. Run kkauto-skill install first.' }, null, 2)}\n`);
    else process.stdout.write('No installs found. Run kkauto-skill install first.\n');
    return;
  }
  if (options.json) {
    const installs = [];
    for (const install of registry.installs) {
      installs.push(await runInstall({ agent: install.agent, packs: install.packs.join(','), dryRun: options.dryRun, json: true, emit: false }));
    }
    process.stdout.write(`${JSON.stringify({ installs }, null, 2)}\n`);
    return;
  }
  for (const install of registry.installs) {
    await runInstall({ agent: install.agent, packs: install.packs.join(','), dryRun: options.dryRun });
  }
}
