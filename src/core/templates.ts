import { DEFAULT_MCP_ENV, MCP_ARGS, MCP_COMMAND, MCP_SERVER_NAME } from '../constants.js';
import type { McpConfigInput } from '../agents/types.js';

export function defaultMcpInput(): McpConfigInput {
  return {
    serverName: MCP_SERVER_NAME,
    command: MCP_COMMAND,
    args: [...MCP_ARGS],
    env: { ...DEFAULT_MCP_ENV }
  };
}

export function renderJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function renderMcpServerJson(input: McpConfigInput): string {
  return renderJson({
    command: input.command,
    args: input.args,
    env: input.env
  });
}

export function renderMcpServersJson(input: McpConfigInput): string {
  return renderJson({
    mcpServers: {
      [input.serverName]: {
        command: input.command,
        args: input.args,
        env: input.env
      }
    }
  });
}

export function renderCodexToml(input: McpConfigInput): string {
  const args = input.args.map((arg) => JSON.stringify(arg)).join(', ');
  return [
    `[mcp_servers.${input.serverName}]`,
    `command = ${JSON.stringify(input.command)}`,
    `args = [${args}]`,
    `[mcp_servers.${input.serverName}.env]`,
    `KK_API_BASE_URL = ${JSON.stringify(input.env.KK_API_BASE_URL)}`,
    `KK_API_TOKEN = ${JSON.stringify(input.env.KK_API_TOKEN)}`,
    ''
  ].join('\n');
}
