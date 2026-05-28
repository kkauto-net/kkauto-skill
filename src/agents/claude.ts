import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderMcpServersJson } from '../core/templates.js';
import type { AdapterContext, AgentAdapter, AgentDetection, InstallTarget, McpConfigInput } from './types.js';

export const claudeAdapter: AgentAdapter = {
  name: 'claude',
  displayName: 'Claude',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const configDir = join(context.homeDir, '.claude');
    const detected = await pathExists(configDir);
    return {
      detected,
      confidence: detected ? 'medium' : 'low',
      reason: detected ? `Found ${configDir}` : `Missing ${configDir}`
    };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return [{ type: 'skill', path: join(context.homeDir, '.claude', 'skills', 'kkauto'), mode: 'directory' }];
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    return { type: 'mcp-config', path: join(context.homeDir, '.claude', 'mcp.json'), mode: 'json-merge' };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderMcpServersJson(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
