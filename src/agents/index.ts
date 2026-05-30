import { homedir } from 'node:os';
import { antigravityAdapter } from './antigravity.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { cursorAdapter } from './cursor.js';
import { opencodeAdapter } from './opencode.js';
import type { AdapterContext, AgentAdapter, AgentName } from './types.js';

export const supportedAgents: AgentName[] = ['claude', 'opencode', 'codex', 'antigravity', 'cursor'];
export const supportedInstallSelectors = ['auto', 'all', ...supportedAgents] as const;
export const supportedAgentList = supportedAgents.join('|');
export const supportedSelectorList = supportedInstallSelectors.join('|');

export const adapters: Record<AgentName, AgentAdapter> = {
  claude: claudeAdapter,
  opencode: opencodeAdapter,
  codex: codexAdapter,
  antigravity: antigravityAdapter,
  cursor: cursorAdapter
};

export function createContext(
  homeDir = homedir(),
  projectDir = process.cwd(),
  antigravityScopes?: import('./types.js').AntigravityScope[]
): AdapterContext {
  return { homeDir, projectDir, antigravityScopes };
}

export function getAdapter(name: AgentName): AgentAdapter {
  return adapters[name];
}

export function isAgentName(value: string): value is AgentName {
  return value in adapters;
}

export type { AgentName } from './types.js';
