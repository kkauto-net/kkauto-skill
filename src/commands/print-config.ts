import { defaultMcpInput } from '../core/templates.js';
import { getAdapter, isAgentName } from '../agents/index.js';

export interface PrintConfigOptions {
  agent?: string;
  json?: boolean;
}

export async function runPrintConfig(options: PrintConfigOptions): Promise<void> {
  const agent = options.agent ?? 'opencode';
  if (!isAgentName(agent)) throw new Error(`Unsupported agent: ${agent}`);
  const rendered = await getAdapter(agent).renderMcpConfig(defaultMcpInput());
  if (options.json) process.stdout.write(`${JSON.stringify({ agent, format: agent === 'codex' ? 'toml' : 'json', config: rendered }, null, 2)}\n`);
  else process.stdout.write(rendered);
}
