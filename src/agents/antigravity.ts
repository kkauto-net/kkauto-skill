import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderMcpServersJson } from '../core/templates.js';
import type { AdapterContext, AgentAdapter, AgentDetection, InstallTarget, McpConfigInput } from './types.js';

function candidatePaths(homeDir: string): string[] {
  return [
    join(homeDir, '.gemini', 'antigravity', 'mcp_config.json'),
    join(homeDir, '.gemini', 'config', 'mcp_config.json')
  ];
}

export const antigravityAdapter: AgentAdapter = {
  name: 'antigravity',
  displayName: 'Antigravity CLI',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const existing = [];
    for (const candidate of candidatePaths(context.homeDir)) {
      if (await pathExists(candidate)) existing.push(candidate);
    }
    if (existing.length > 0) {
      return { detected: true, confidence: existing.length === 1 ? 'high' : 'medium', reason: `Found ${existing.join(', ')}` };
    }
    return { detected: false, confidence: 'low', reason: 'Missing Antigravity MCP config candidates' };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return [{ type: 'skill', path: join(context.homeDir, '.gemini', 'antigravity', 'skills', 'kkauto'), mode: 'directory' }];
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    const existing = [];
    for (const candidate of candidatePaths(context.homeDir)) {
      if (await pathExists(candidate)) existing.push(candidate);
    }
    if (existing.length > 1) {
      return { type: 'mcp-config', path: existing.join(' | '), mode: 'manual' };
    }
    if (existing.length === 0) {
      return { type: 'mcp-config', path: candidatePaths(context.homeDir).join(' | '), mode: 'manual' };
    }
    return { type: 'mcp-config', path: existing[0], mode: 'json-merge' };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderMcpServersJson(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
