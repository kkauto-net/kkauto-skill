import { homedir } from 'node:os';
import type { McpConfigInput } from '../agents/types.js';
import { MCP_ARGS, MCP_COMMAND, MCP_SERVER_NAME, DEFAULT_MCP_ENV } from '../constants.js';
import type { CredentialsData } from './credentials.js';
import { credentialsPath } from './credentials.js';

export type McpLaunchMode = 'wrapper' | 'placeholder';

export interface BuildMcpInputOptions {
  mode: McpLaunchMode;
  homeDir?: string;
  optionalEnv?: Partial<CredentialsData>;
}

function shellSingleQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function credentialsShellExportScript(credentialsFilePath: string): string {
  const escaped = shellSingleQuote(credentialsFilePath);
  return [
    'while IFS= read -r line || [ -n "$line" ]; do',
    'case "$line" in \'\'|\'#\'*) continue ;; esac;',
    'case "$line" in *=*) ;; *) continue ;; esac;',
    'key="${line%%=*}";',
    'value="${line#*=}";',
    'case "$key" in',
    'KK_API_BASE_URL|KK_API_TOKEN|KK_MCP_ENABLE_DELETE|KK_MCP_DEFAULT_STATUS|KK_MCP_MAX_LIST_LIMIT) export "$key=$value" ;;',
    'esac;',
    `done < ${escaped}`
  ].join(' ');
}

export function wrapperLaunchScript(credentialsFilePath: string): { command: string; args: string[] } {
  return {
    command: 'bash',
    args: ['-lc', `${credentialsShellExportScript(credentialsFilePath)}; exec ${MCP_COMMAND} ${MCP_ARGS.join(' ')}`]
  };
}

export function buildMcpConfigInput(options: BuildMcpInputOptions): McpConfigInput {
  if (options.mode === 'placeholder') {
    return {
      serverName: MCP_SERVER_NAME,
      launchMode: 'placeholder',
      command: MCP_COMMAND,
      args: [...MCP_ARGS],
      env: {
        KK_API_BASE_URL: options.optionalEnv?.KK_API_BASE_URL ?? DEFAULT_MCP_ENV.KK_API_BASE_URL,
        KK_API_TOKEN: options.optionalEnv?.KK_API_TOKEN ?? DEFAULT_MCP_ENV.KK_API_TOKEN
      }
    };
  }
  const { command, args } = wrapperLaunchScript(credentialsPath(options.homeDir ?? homedir()));
  return {
    serverName: MCP_SERVER_NAME,
    launchMode: 'wrapper',
    command,
    args
  };
}

export function usesCredentialsWrapper(content: string | null): boolean {
  if (!content) return false;
  return content.includes('credentials.env') && content.includes('kkauto-mcp');
}
