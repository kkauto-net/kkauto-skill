export type AgentName = 'claude' | 'opencode' | 'codex' | 'antigravity' | 'cursor';
export type InstallAgentSelector = AgentName | 'auto' | 'all';

export interface AgentDetection {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface InstallTarget {
  type: 'skill' | 'mcp-config';
  path: string;
  mode: 'directory' | 'file' | 'cursor-rules' | 'skill-file' | 'json-merge' | 'toml-merge' | 'manual' | 'command';
}

export type McpLaunchMode = 'wrapper' | 'placeholder';

export interface McpConfigInput {
  serverName: 'kkauto';
  launchMode: McpLaunchMode;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export type AntigravityScope = 'workspace' | 'global' | 'shared';

export interface AdapterContext {
  homeDir: string;
  projectDir?: string;
  antigravityScopes?: AntigravityScope[];
}

export interface AgentAdapter {
  name: AgentName;
  displayName: string;
  detect(context: AdapterContext): Promise<AgentDetection>;
  getSkillTargets(context: AdapterContext): Promise<InstallTarget[]>;
  getMcpConfigTarget(context: AdapterContext): Promise<InstallTarget | null>;
  renderMcpConfig(input: McpConfigInput): Promise<string>;
  supportsAutomaticMcpWrite(): boolean;
}
