import type { McpConfigInput } from '../agents/types.js';
import { DEFAULT_MCP_ENV, MCP_ARGS, MCP_COMMAND, MCP_SERVER_NAME } from '../constants.js';
import type { McpLaunchMode } from './mcp-launch.js';
import { buildMcpConfigInput } from './mcp-launch.js';

export function defaultMcpInput(mode: McpLaunchMode = 'placeholder'): McpConfigInput {
  return buildMcpConfigInput({ mode });
}

export function renderJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function renderMcpServerJson(input: McpConfigInput): string {
  const block: Record<string, unknown> = {
    command: input.command,
    args: input.args
  };
  if (input.launchMode === 'placeholder' && input.env) {
    block.env = input.env;
  }
  return renderJson(block);
}

export function renderMcpServersJson(input: McpConfigInput): string {
  return renderJson({
    mcpServers: {
      [input.serverName]: JSON.parse(renderMcpServerJson(input).trim())
    }
  });
}

export function renderCodexToml(input: McpConfigInput): string {
  const args = input.args.map((arg) => JSON.stringify(arg)).join(', ');
  const lines = [
    `[mcp_servers.${input.serverName}]`,
    `command = ${JSON.stringify(input.command)}`,
    `args = [${args}]`
  ];
  if (input.launchMode === 'placeholder' && input.env) {
    lines.push(`[mcp_servers.${input.serverName}.env]`);
    lines.push(`KK_API_BASE_URL = ${JSON.stringify(input.env.KK_API_BASE_URL ?? DEFAULT_MCP_ENV.KK_API_BASE_URL)}`);
    lines.push(`KK_API_TOKEN = ${JSON.stringify(input.env.KK_API_TOKEN ?? DEFAULT_MCP_ENV.KK_API_TOKEN)}`);
  }
  lines.push('');
  return lines.join('\n');
}

export { buildMcpConfigInput, MCP_SERVER_NAME, MCP_COMMAND, MCP_ARGS, DEFAULT_MCP_ENV };
