import { join } from 'node:path';
import { pathExists } from '../core/file-utils.js';
import { renderCodexToml } from '../core/templates.js';
import type { AdapterContext, AgentAdapter, AgentDetection, InstallTarget, McpConfigInput } from './types.js';

export const codexAdapter: AgentAdapter = {
  name: 'codex',
  displayName: 'Codex CLI',
  async detect(context: AdapterContext): Promise<AgentDetection> {
    const configPath = join(context.homeDir, '.codex', 'config.toml');
    const configDir = join(context.homeDir, '.codex');
    if (await pathExists(configPath)) {
      return { detected: true, confidence: 'high', reason: `Found ${configPath}` };
    }
    if (await pathExists(configDir)) {
      return { detected: true, confidence: 'medium', reason: `Found ${configDir}` };
    }
    return { detected: false, confidence: 'low', reason: `Missing ${configDir}` };
  },
  async getSkillTargets(context: AdapterContext): Promise<InstallTarget[]> {
    return [{ type: 'skill', path: join(context.homeDir, '.codex', 'skills', 'kkauto'), mode: 'directory' }];
  },
  async getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget> {
    return { type: 'mcp-config', path: join(context.homeDir, '.codex', 'config.toml'), mode: 'toml-merge' };
  },
  async renderMcpConfig(input: McpConfigInput): Promise<string> {
    return renderCodexToml(input);
  },
  supportsAutomaticMcpWrite(): boolean {
    return true;
  }
};
