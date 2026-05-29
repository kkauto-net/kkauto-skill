import { adapters, createContext, supportedAgentList } from './index.js';
import type { AgentAdapter, AgentName, InstallAgentSelector } from './types.js';

export interface DetectionCandidate {
  agent: AgentName;
  adapter: AgentAdapter;
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export async function detectAgents(homeDir?: string, projectDir?: string): Promise<DetectionCandidate[]> {
  const context = createContext(homeDir, projectDir);
  const results: DetectionCandidate[] = [];
  for (const [agent, adapter] of Object.entries(adapters) as [AgentName, AgentAdapter][]) {
    const detection = await adapter.detect(context);
    results.push({ agent, adapter, ...detection });
  }
  return results;
}

export async function resolveAgent(name: Exclude<InstallAgentSelector, 'all'>, homeDir?: string): Promise<AgentAdapter> {
  if (name !== 'auto') {
    const adapter = adapters[name as AgentName];
    if (!adapter) throw new Error(`Unsupported agent: ${name}`);
    return adapter;
  }
  const detected = (await detectAgents(homeDir)).filter((candidate) => candidate.detected);
  if (detected.length === 1) return detected[0].adapter;
  if (detected.length === 0) throw new Error(`No supported agent detected. Pass --agent ${supportedAgentList}.`);
  throw new Error(`Multiple agents detected: ${detected.map((candidate) => candidate.agent).join(', ')}. Pass --agent <name> or --agent all.`);
}
