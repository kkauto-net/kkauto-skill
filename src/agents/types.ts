export type AgentName = 'claude' | 'opencode' | 'codex' | 'antigravity';

export interface AgentDetection {
  detected: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface InstallTarget {
  type: 'skill' | 'mcp-config';
  path: string;
  mode: 'directory' | 'file' | 'json-merge' | 'toml-merge' | 'manual' | 'command';
}

export interface McpConfigInput {
  serverName: 'kkauto';
  command: 'npx';
  args: string[];
  env: Record<'KK_API_BASE_URL' | 'KK_API_TOKEN', string>;
}

export interface AdapterContext {
  homeDir: string;
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
