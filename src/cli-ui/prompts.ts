import * as p from '@clack/prompts';
import { adapters, supportedAgents } from '../agents/index.js';
import { detectAgents } from '../agents/detect.js';
import type { AgentAdapter, AgentName, AntigravityScope } from '../agents/types.js';
import {
  BASE_URL_PLACEHOLDER,
  TOKEN_PLACEHOLDER
} from '../constants.js';
import type { CredentialsData } from '../core/credentials.js';
import { mergeCredentialsInput, readCredentials, validateBaseUrl } from '../core/credentials.js';

export function canUseInteractivePrompts(json?: boolean): boolean {
  return !json && Boolean(process.stdin.isTTY) && Boolean(process.stdout.isTTY);
}

export async function promptSelectAgents(
  homeDir?: string,
  projectDir?: string
): Promise<AgentAdapter[]> {
  const detections = await detectAgents(homeDir, projectDir);
  const detectedSet = new Set(detections.filter((d) => d.detected).map((d) => d.agent));

  const selected = await p.multiselect({
    message: 'Chọn AI agents để cài kkAuto skills + MCP',
    options: supportedAgents.map((agent) => {
      const adapter = adapters[agent];
      const hint = detectedSet.has(agent) ? 'đã phát hiện' : 'chưa phát hiện';
      return { value: agent, label: adapter.displayName, hint };
    }),
    initialValues: [...supportedAgents],
    required: true
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy.');
    process.exit(0);
  }

  return (selected as AgentName[]).map((name) => adapters[name]);
}

export async function promptCredentials(homeDir?: string): Promise<CredentialsData | null> {
  const existing = await readCredentials(homeDir);

  const baseUrl = await p.text({
    message: 'kkAuto base URL (KK_API_BASE_URL)',
    placeholder: existing?.KK_API_BASE_URL ?? BASE_URL_PLACEHOLDER,
    initialValue: existing?.KK_API_BASE_URL,
    validate(value) {
      if (!value?.trim()) return 'URL là bắt buộc';
      if (!validateBaseUrl(value.trim())) return 'URL phải là http(s) hợp lệ';
    }
  });
  if (p.isCancel(baseUrl)) {
    p.cancel('Đã hủy.');
    process.exit(0);
  }

  const apiToken = await p.password({
    message: 'API token (KK_API_TOKEN) — lấy từ /wtadmin/mcp',
    validate(value) {
      if (value?.trim()) return;
      if (existing?.KK_API_TOKEN && existing.KK_API_TOKEN !== TOKEN_PLACEHOLDER) return;
      return 'Token là bắt buộc (Enter để giữ token hiện có nếu đã cấu hình)';
    }
  });
  if (p.isCancel(apiToken)) {
    p.cancel('Đã hủy.');
    process.exit(0);
  }

  const tokenValue = typeof apiToken === 'string' && apiToken.trim()
    ? apiToken.trim()
    : existing?.KK_API_TOKEN;

  if (!tokenValue || tokenValue === TOKEN_PLACEHOLDER) {
    p.log.warn('Chưa có token hợp lệ — MCP sẽ dùng placeholder cho đến khi bạn cập nhật credentials.env');
  }

  return mergeCredentialsInput(existing, {
    baseUrl: String(baseUrl).trim().replace(/\/+$/, ''),
    apiToken: tokenValue
  });
}

export async function promptAntigravityScopes(): Promise<AntigravityScope[]> {
  const selected = await p.multiselect({
    message: 'Antigravity CLI — phạm vi cài skill',
    options: [
      { value: 'workspace', label: 'Workspace', hint: '.agents/skills/{pack}/SKILL.md' },
      { value: 'global', label: 'Global', hint: '~/.gemini/antigravity-cli/skills/{pack}/SKILL.md' },
      { value: 'shared', label: 'Shared', hint: '~/.gemini/skills/{pack}/SKILL.md' }
    ],
    initialValues: ['global'],
    required: true
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy.');
    process.exit(0);
  }

  return selected as AntigravityScope[];
}

export function printInstallIntro(version: string): void {
  p.intro(`kkauto-skill v${version}`);
}

export async function confirmInstall(dryRun: boolean): Promise<boolean> {
  if (dryRun) return true;
  const ok = await p.confirm({ message: 'Tiếp tục cài đặt?' });
  if (p.isCancel(ok)) {
    p.cancel('Đã hủy.');
    process.exit(0);
  }
  return Boolean(ok);
}

export function printInstallSummary(results: Array<{ agent: string; ok: boolean; error?: string }>): void {
  for (const item of results) {
    if (item.ok) p.log.success(`${item.agent}: OK`);
    else p.log.error(`${item.agent}: ${item.error ?? 'failed'}`);
  }
  p.outro('Hoàn tất. Chạy `npx kkauto-skill doctor` để kiểm tra MCP.');
}
