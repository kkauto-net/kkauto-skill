import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentName } from '../agents/types.js';
import { createContext, getAdapter, isAgentName, supportedAgents } from '../agents/index.js';
import { detectAgents } from '../agents/detect.js';
import { inspectCredentialsFile, readCredentials } from '../core/credentials.js';
import { usesCredentialsWrapper } from '../core/mcp-launch.js';
import { pathExists, readTextIfExists } from '../core/file-utils.js';
import { readRegistry } from '../core/registry.js';
import { redact } from '../core/redaction.js';

const execFileAsync = promisify(execFile);

export interface DoctorOptions {
  agent?: string;
  json?: boolean;
  homeDir?: string;
}

async function commandWorks(command: string, args: string[]): Promise<boolean> {
  try {
    await execFileAsync(command, args, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function inspectAgentMcp(agent: AgentName, homeDir?: string, projectDir?: string) {
  const adapter = getAdapter(agent);
  const context = createContext(homeDir, projectDir);
  const target = await adapter.getMcpConfigTarget(context);
  if (!target) return null;
  const exists = target.mode === 'manual' ? false : await pathExists(target.path);
  const content = exists ? await readTextIfExists(target.path) : null;
  return {
    path: target.path,
    mode: target.mode,
    exists,
    usesCredentialsWrapper: usesCredentialsWrapper(content),
    hasTokenPlaceholder: content?.includes('paste-token-here') ?? false,
    deleteEnabled: Boolean(content?.includes('KK_MCP_ENABLE_DELETE') && content.includes('true'))
  };
}

export async function runDoctor(options: DoctorOptions): Promise<void> {
  if (options.agent && !isAgentName(options.agent)) {
    throw new Error(`Unsupported agent: ${options.agent}`);
  }

  const detections = await detectAgents(options.homeDir);
  const registry = await readRegistry(options.homeDir);
  const credentials = await inspectCredentialsFile(options.homeDir);
  const credData = await readCredentials(options.homeDir);

  const checks: Record<string, unknown> = {
    node: process.versions.node,
    npx: await commandWorks('npx', ['--version']),
    credentialsFile: credentials,
    credentialsConfigured: Boolean(credData && !credentials.usesPlaceholder),
    detectedAgents: detections.filter((item) => item.detected).map((item) => ({ agent: item.agent, confidence: item.confidence, reason: item.reason })),
    installs: registry.installs.map((item) => ({ agent: item.agent, packs: item.packs, packageVersion: item.packageVersion }))
  };

  const agentsToInspect = options.agent
    ? [options.agent as AgentName]
    : registry.installs.length > 0
      ? [...new Set(registry.installs.map((item) => item.agent))]
      : supportedAgents;

  for (const agent of agentsToInspect) {
    const info = await inspectAgentMcp(agent, options.homeDir);
    if (info) checks[`${agent}McpConfig`] = info;
  }

  const output = JSON.stringify(checks, null, 2);
  process.stdout.write(`${redact(output)}\n`);
}
