export const PACKAGE_NAME = 'kkauto-skill';
export const MCP_SERVER_NAME = 'kkauto';
export const MCP_COMMAND = 'npx';
export const MCP_ARGS = ['-y', 'kkauto-mcp'] as const;
export const TOKEN_PLACEHOLDER = 'paste-token-here';
export const BASE_URL_PLACEHOLDER = 'https://your-tenant.example.com';
export const REGISTRY_VERSION = 1;

export const DEFAULT_MCP_ENV = {
  KK_API_BASE_URL: BASE_URL_PLACEHOLDER,
  KK_API_TOKEN: TOKEN_PLACEHOLDER
} as const;
