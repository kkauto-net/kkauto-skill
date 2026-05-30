import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderMcpServersJson } from '../core/templates.js';
import type {
  AdapterContext,
  AgentAdapter,
  AgentDetection,
  AntigravityScope,
  InstallTarget,
  McpConfigInput
} from './types.js';

const LEGACY_MCP_CANDIDATES = (homeDir: string) => [
  join(homeDir, '.gemini', 'antigravity', 'mcp_config.json'),
  join(homeDir, '.gemini', 'config', 'mcp_config.json')
];

export function defaultAntigravityScopes(): AntigravityScope[] {
  return ['global'];
}

export function resolveAntigravityScopes(context: AdapterContext): AntigravityScope[] {
  if (context.antigravityScopes?.length) return context.antigravityScopes;
  return defaultAntigravityScopes();
}

function projectDir(context: AdapterContext): string {
  return context.projectDir ?? process.cwd();
}

export function antigravitySkillBase(scope: AntigravityScope, context: AdapterContext): string {
  switch (scope) {
    case 'workspace':
      return join(projectDir(context), '.agents', 'skills');
    case 'global':
      return join(context.homeDir, '.gemini', 'antigravity-cli', 'skills');
    case 'shared':
      return join(context.homeDir, '.gemini', 'skills');
  }
}

export function antigravityMcpTargets(scopes: AntigravityScope[], context: AdapterContext): InstallTarget[] {
  const targets: InstallTarget[] = [];
  const seen = new Set<string>();
  for (const scope of scopes) {
    const path = scope === 'workspace'
      ? join(projectDir(context), '.agents', 'mcp_config.json')
      : join(context.homeDir, '.gemini', 'config', 'mcp_config.json');
    if (seen.has(path)) continue;
    seen.add(path);
    targets.push({ type: 'mcp-config', path, mode: 'json-merge' });
  }
  return targets;
}

export const antigravityAdapter: AgentAdapter = {
  name: 'antigravity',
  displayName: 'Antigravity CLI',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const hints: string[] = [];
    if (await pathExists(join(context.homeDir, '.gemini', 'antigravity-cli'))) {
      hints.push('~/.gemini/antigravity-cli');
    }
    if (await pathExists(join(context.homeDir, '.gemini', 'skills'))) {
      hints.push('~/.gemini/skills');
    }
    if (await pathExists(join(projectDir(context), '.agents', 'skills'))) {
      hints.push('.agents/skills');
    }
    for (const candidate of LEGACY_MCP_CANDIDATES(context.homeDir)) {
      if (await pathExists(candidate)) hints.push(candidate);
    }
    if (hints.length > 0) {
      return {
        detected: true,
        confidence: hints.length === 1 ? 'high' : 'medium',
        reason: `Found ${hints.join(', ')}`
      };
    }
    return { detected: false, confidence: 'low', reason: 'Missing Antigravity CLI paths' };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return resolveAntigravityScopes(context).map((scope) => ({
      type: 'skill' as const,
      path: antigravitySkillBase(scope, context),
      mode: 'skill-file' as const
    }));
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    const legacy = [];
    for (const candidate of LEGACY_MCP_CANDIDATES(context.homeDir)) {
      if (await pathExists(candidate)) legacy.push(candidate);
    }
    if (legacy.length > 1) {
      return { type: 'mcp-config', path: legacy.join(' | '), mode: 'manual' };
    }
    const scopes = resolveAntigravityScopes(context);
    const targets = antigravityMcpTargets(scopes, context);
    return targets[0] ?? {
      type: 'mcp-config',
      path: join(context.homeDir, '.gemini', 'config', 'mcp_config.json'),
      mode: 'json-merge'
    };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderMcpServersJson(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
