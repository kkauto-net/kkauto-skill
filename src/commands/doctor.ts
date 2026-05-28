import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentName } from '../agents/types.js';
import { createContext, getAdapter, isAgentName } from '../agents/index.js';
import { detectAgents } from '../agents/detect.js';
import { pathExists, readTextIfExists } from '../core/file-utils.js';
import { readRegistry } from '../core/registry.js';
import { redact } from '../core/redaction.js';

const execFileAsync = promisify(execFile);

export interface DoctorOptions {
  agent?: string;
  json?: boolean;
}

async function commandWorks(command: string, args: string[]): Promise<boolean> {
  try {
    await execFileAsync(command, args, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export async function runDoctor(options: DoctorOptions): Promise<void> {
  if (options.agent && !isAgentName(options.agent)) {
    throw new Error(`Unsupported agent: ${options.agent}`);
  }

  const detections = await detectAgents();
  const registry = await readRegistry();
  const checks: Record<string, unknown> = {
    node: process.versions.node,
    npx: await commandWorks('npx', ['--version']),
    detectedAgents: detections.filter((item) => item.detected).map((item) => ({ agent: item.agent, confidence: item.confidence, reason: item.reason })),
    installs: registry.installs.map((item) => ({ agent: item.agent, packs: item.packs, packageVersion: item.packageVersion }))
  };

  if (options.agent) {
    const agent = options.agent as AgentName;
    const adapter = getAdapter(agent);
    const context = createContext();
    const target = await adapter.getMcpConfigTarget(context);
    if (target) {
      const exists = target.mode === 'manual' ? false : await pathExists(target.path);
      const content = exists ? await readTextIfExists(target.path) : null;
      checks[`${agent}McpConfig`] = {
        path: target.path,
        mode: target.mode,
        exists,
        hasTokenPlaceholder: content?.includes('paste-token-here') ?? false,
        deleteEnabled: Boolean(content?.includes('KK_MCP_ENABLE_DELETE') && content.includes('true'))
      };
    }
  }

  const output = JSON.stringify(checks, null, 2);
  if (options.json) process.stdout.write(`${redact(output)}\n`);
  else process.stdout.write(`${redact(output)}\n`);
}
