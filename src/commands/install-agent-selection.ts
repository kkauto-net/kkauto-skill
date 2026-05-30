import { adapters, supportedAgents } from '../agents/index.js';
import { detectAgents } from '../agents/detect.js';
import type { AgentAdapter, InstallAgentSelector } from '../agents/types.js';
import {
  canUseInteractivePrompts,
  promptAntigravityScopes,
  promptSelectAgents
} from '../cli-ui/prompts.js';
import type { AntigravityScope } from '../agents/types.js';

export interface ResolveInstallAgentsOptions {
  selector: InstallAgentSelector;
  json?: boolean;
  noInteractive?: boolean;
  homeDir?: string;
  projectDir?: string;
}

export interface ResolveInstallAgentsResult {
  adapters: AgentAdapter[];
  antigravityScopes?: AntigravityScope[];
}

export async function resolveInstallAgents(options: ResolveInstallAgentsOptions): Promise<ResolveInstallAgentsResult> {
  if (options.selector !== 'auto' && options.selector !== 'all') {
    const adapter = adapters[options.selector];
    if (!adapter) throw new Error(`Unsupported agent: ${options.selector}`);
    return { adapters: [adapter] };
  }

  const interactive = canUseInteractivePrompts(options.json) && !options.noInteractive;

  if (options.selector === 'all') {
    if (interactive) {
      const selected = await promptSelectAgents(options.homeDir, options.projectDir);
      return finalizeSelection(selected, interactive);
    }
    return { adapters: supportedAgents.map((name) => adapters[name]) };
  }

  if (interactive) {
    const selected = await promptSelectAgents(options.homeDir, options.projectDir);
    return finalizeSelection(selected, interactive);
  }

  const detected = (await detectAgents(options.homeDir, options.projectDir)).filter((candidate) => candidate.detected);
  if (detected.length === 0) {
    throw new Error(`No supported agent detected. Pass --agent ${supportedAgents.join('|')} or --agent all.`);
  }
  if (detected.length === 1) return { adapters: [detected[0].adapter] };
  throw new Error(
    `Multiple agents detected: ${detected.map((candidate) => candidate.agent).join(', ')}. Pass --agent <name>, --agent all, or run interactively.`
  );
}

async function finalizeSelection(
  selected: AgentAdapter[],
  interactive: boolean
): Promise<ResolveInstallAgentsResult> {
  let antigravityScopes: AntigravityScope[] | undefined;
  if (interactive && selected.some((adapter) => adapter.name === 'antigravity')) {
    antigravityScopes = await promptAntigravityScopes();
  }
  return { adapters: selected, antigravityScopes };
}
