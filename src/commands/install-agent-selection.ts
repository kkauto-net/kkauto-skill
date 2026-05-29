import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { adapters, supportedAgentList } from '../agents/index.js';
import { detectAgents } from '../agents/detect.js';
import type { AgentAdapter, AgentName, InstallAgentSelector } from '../agents/types.js';

export interface ResolveInstallAgentsOptions {
  selector: InstallAgentSelector;
  json?: boolean;
  homeDir?: string;
  projectDir?: string;
}

function canPrompt(json?: boolean): boolean {
  return !json && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}

async function promptForAgents(detected: Awaited<ReturnType<typeof detectAgents>>): Promise<AgentAdapter[]> {
  const choices = detected.filter((candidate) => candidate.detected);
  const lines = choices.map((candidate, index) => `${index + 1}. ${candidate.adapter.displayName} (${candidate.agent})`).join('\n');
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(`Multiple agents detected:\n${lines}\n${choices.length + 1}. All detected agents\nChoose agent number(s), comma-separated, or all: `);
    const normalized = answer.trim().toLowerCase();
    if (normalized === 'all' || normalized === String(choices.length + 1)) {
      return choices.map((candidate) => candidate.adapter);
    }
    const indexes = normalized.split(',').map((item) => Number(item.trim())).filter((item) => Number.isInteger(item));
    const selected = indexes.map((index) => choices[index - 1]).filter(Boolean);
    if (selected.length === 0) throw new Error('No valid agent selection entered. Pass --agent <name> or --agent all.');
    return [...new Map(selected.map((candidate) => [candidate.agent, candidate.adapter])).values()];
  } finally {
    rl.close();
  }
}

export async function resolveInstallAgents(options: ResolveInstallAgentsOptions): Promise<AgentAdapter[]> {
  if (options.selector !== 'auto' && options.selector !== 'all') {
    const adapter = adapters[options.selector as AgentName];
    if (!adapter) throw new Error(`Unsupported agent: ${options.selector}`);
    return [adapter];
  }

  const detected = (await detectAgents(options.homeDir, options.projectDir)).filter((candidate) => candidate.detected);
  if (detected.length === 0) throw new Error(`No supported agent detected. Pass --agent ${supportedAgentList}.`);
  if (options.selector === 'all') return detected.map((candidate) => candidate.adapter);
  if (detected.length === 1) return [detected[0].adapter];
  if (canPrompt(options.json)) return promptForAgents(detected);
  throw new Error(`Multiple agents detected: ${detected.map((candidate) => candidate.agent).join(', ')}. Pass --agent <name> or --agent all.`);
}
