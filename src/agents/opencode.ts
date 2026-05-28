import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderMcpServersJson } from '../core/templates.js';
import type { AdapterContext, AgentAdapter, AgentDetection, InstallTarget, McpConfigInput } from './types.js';

export const opencodeAdapter: AgentAdapter = {
  name: 'opencode',
  displayName: 'OpenCode',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const configDir = join(context.homeDir, '.config', 'opencode');
    const detected = await pathExists(configDir);
    return {
      detected,
      confidence: detected ? 'high' : 'low',
      reason: detected ? `Found ${configDir}` : `Missing ${configDir}`
    };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return [{ type: 'skill', path: join(context.homeDir, '.config', 'opencode', 'skills', 'kkauto'), mode: 'directory' }];
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    return { type: 'mcp-config', path: join(context.homeDir, '.config', 'opencode', 'opencode.json'), mode: 'json-merge' };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderMcpServersJson(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
