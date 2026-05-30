import { buildMcpConfigInput } from '../core/templates.js';
import { getAdapter, isAgentName } from '../agents/index.js';
import { readCredentials } from '../core/credentials.js';

export interface PrintConfigOptions {
  agent?: string;
  json?: boolean;
  usePlaceholders?: boolean;
  homeDir?: string;
}

export async function runPrintConfig(options: PrintConfigOptions): Promise<void> {
  const agent = options.agent ?? 'opencode';
  if (!isAgentName(agent)) throw new Error(`Unsupported agent: ${agent}`);
  let mode: 'wrapper' | 'placeholder' = options.usePlaceholders ? 'placeholder' : 'wrapper';
  if (!options.usePlaceholders) {
    const existing = await readCredentials(options.homeDir);
    if (!existing) mode = 'placeholder';
  }
  const rendered = await getAdapter(agent).renderMcpConfig(buildMcpConfigInput({ mode, homeDir: options.homeDir }));
  if (options.json) process.stdout.write(`${JSON.stringify({ agent, format: agent === 'codex' ? 'toml' : 'json', launchMode: mode, config: rendered }, null, 2)}\n`);
  else process.stdout.write(rendered);
}
