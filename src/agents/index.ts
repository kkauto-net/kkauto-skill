import { homedir } from 'node:os';
import { antigravityAdapter } from './antigravity.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { opencodeAdapter } from './opencode.js';
import type { AdapterContext, AgentAdapter, AgentName } from './types.js';

export const adapters: Record<AgentName, AgentAdapter> = {
  claude: claudeAdapter,
  opencode: opencodeAdapter,
  codex: codexAdapter,
  antigravity: antigravityAdapter
};

export function createContext(homeDir = homedir()): AdapterContext {
  return { homeDir };
}

export function getAdapter(name: AgentName): AgentAdapter {
  return adapters[name];
}

export function isAgentName(value: string): value is AgentName {
  return value in adapters;
}

export type { AgentName } from './types.js';
