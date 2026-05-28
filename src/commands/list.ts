import { adapters } from '../agents/index.js';
import { loadManifest } from '../core/manifest.js';
import { readRegistry } from '../core/registry.js';

export interface ListOptions {
  json?: boolean;
}

export async function runList(options: ListOptions): Promise<void> {
  const manifest = await loadManifest();
  const registry = await readRegistry();
  const payload = {
    agents: Object.keys(adapters),
    defaultPacks: manifest.defaultPacks,
    packs: manifest.packs,
    installs: registry.installs
  };
  if (options.json) process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  else {
    process.stdout.write(`Agents: ${payload.agents.join(', ')}\n`);
    process.stdout.write(`Default packs: ${payload.defaultPacks.join(', ')}\n`);
    process.stdout.write(`Available packs: ${Object.keys(payload.packs).join(', ')}\n`);
    process.stdout.write(`Installed agents: ${payload.installs.map((item) => item.agent).join(', ') || 'none'}\n`);
  }
}
