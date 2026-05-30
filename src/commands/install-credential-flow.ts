import type { CredentialsData } from '../core/credentials.js';
import {
  mergeCredentialsInput,
  readCredentials,
  resolveCredentialsMode,
  writeCredentials
} from '../core/credentials.js';
import { canUseInteractivePrompts, promptCredentials } from '../cli-ui/prompts.js';

export interface CredentialInstallOptions {
  baseUrl?: string;
  apiToken?: string;
  skipCredentials?: boolean;
  usePlaceholders?: boolean;
  noInteractive?: boolean;
  json?: boolean;
  dryRun?: boolean;
  homeDir?: string;
}

export async function resolveInstallCredentials(
  options: CredentialInstallOptions
): Promise<{ launchMode: 'wrapper' | 'placeholder' | 'skip'; credentialsConfigured: boolean }> {
  if (options.usePlaceholders) {
    return { launchMode: 'placeholder', credentialsConfigured: false };
  }

  if (options.skipCredentials) {
    const resolved = await resolveCredentialsMode({ skipCredentials: true, homeDir: options.homeDir });
    return {
      launchMode: resolved.mode === 'wrapper' ? 'wrapper' : 'skip',
      credentialsConfigured: resolved.mode === 'wrapper'
    };
  }

  let data: CredentialsData | undefined;
  const envBase = process.env['KK_API_BASE_URL'];
  const envToken = process.env['KK_API_TOKEN'];

  if (options.baseUrl || options.apiToken) {
    const existing = await readCredentials(options.homeDir);
    data = mergeCredentialsInput(existing, {
      baseUrl: options.baseUrl,
      apiToken: options.apiToken
    });
  } else if (envBase || envToken) {
    const existing = await readCredentials(options.homeDir);
    data = mergeCredentialsInput(existing, {
      baseUrl: envBase,
      apiToken: envToken
    });
  } else if (canUseInteractivePrompts(options.json) && !options.noInteractive) {
    const prompted = await promptCredentials(options.homeDir);
    if (prompted) data = prompted;
  }

  if (data) {
    if (!options.dryRun) {
      await writeCredentials(data, options.homeDir, false);
    }
    return { launchMode: 'wrapper', credentialsConfigured: true };
  }

  const existing = await readCredentials(options.homeDir);
  if (existing) {
    return { launchMode: 'wrapper', credentialsConfigured: true };
  }

  return { launchMode: 'placeholder', credentialsConfigured: false };
}
