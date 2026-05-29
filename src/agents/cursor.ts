import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderMcpServersJson } from '../core/templates.js';
import type { AdapterContext, AgentAdapter, AgentDetection, InstallTarget, McpConfigInput } from './types.js';

function projectDir(context: AdapterContext): string {
  return context.projectDir ?? process.cwd();
}

export const cursorAdapter: AgentAdapter = {
  name: 'cursor',
  displayName: 'Cursor',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const cursorDir = join(projectDir(context), '.cursor');
    const mcpConfig = join(cursorDir, 'mcp.json');
    if (await pathExists(mcpConfig)) {
      return { detected: true, confidence: 'high', reason: `Found ${mcpConfig}` };
    }
    if (await pathExists(cursorDir)) {
      return { detected: true, confidence: 'medium', reason: `Found ${cursorDir}` };
    }
    return { detected: false, confidence: 'low', reason: `Missing ${cursorDir}` };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return [{ type: 'skill', path: join(projectDir(context), '.cursor', 'rules'), mode: 'cursor-rules' }];
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    return { type: 'mcp-config', path: join(projectDir(context), '.cursor', 'mcp.json'), mode: 'json-merge' };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderMcpServersJson(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
