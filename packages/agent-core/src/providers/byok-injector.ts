import type { ProviderClient } from '@myboteam/types';
import { createChildLogger } from '../storage/logger.js';
import type { VaultService } from '../vault/vault-service.js';
import { maskApiKey } from './tools/custom-utils.js';
import type { ProviderConfig } from './tools/provider-config.js';

const log = createChildLogger({ module: 'byok-injector' });

export interface ByokInjectionResult {
  injected: boolean;
  apiKey?: string;
  warning?: string;
}

export interface ByokConfigInjectionResult {
  config: ProviderConfig;
  warning?: string;
}

export class BYOKInjector {
  constructor(private readonly vault: VaultService) {}

  async decryptApiKey(encryptedKey: string): Promise<ByokInjectionResult> {
    try {
      const decrypted = await this.vault.decrypt({ encryptedValue: encryptedKey } as never);
      return { injected: true, apiKey: decrypted };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('locked') || message.includes('LOCKED')) {
        log.warn('Vault is locked, skipping BYOK provider');
        return { injected: false, warning: 'Vault is locked' };
      }

      log.error({ error: message }, 'Failed to decrypt BYOK key');
      return { injected: false, warning: `Decryption failed: ${message}` };
    }
  }

  maskKey(apiKey: string | undefined): string {
    return maskApiKey(apiKey);
  }

  async inject(
    config: ProviderConfig,
    encryptedKey: string,
  ): Promise<ByokConfigInjectionResult> {
    const result = await this.decryptApiKey(encryptedKey);

    if (result.injected && result.apiKey) {
      log.debug({ maskedKey: this.maskKey(result.apiKey) }, 'BYOK key decrypted and injected');
      return {
        config: { ...config, apiKey: result.apiKey },
      };
    }

    return { config, warning: result.warning };
  }

  /**
   * Resolves a ProviderClient with optional BYOK key decryption.
   *
   * @deprecated Use `inject()` for new code. This method is retained for backward
   * compatibility with existing provider client references. The BYOK key is decrypted
   * but not injected into the client (ProviderClient interface doesn't support key
   * injection after construction). Use `inject()` with ProviderConfig instead.
   *
   * @param client - The existing provider client
   * @param byokKey - Optional encrypted BYOK key from vault
   * @returns The client (unchanged) and optional warning if decryption failed
   */
  async resolveProviderClient(
    client: ProviderClient,
    byokKey?: string,
  ): Promise<{ client: ProviderClient; warning?: string }> {
    if (!byokKey) {
      return { client };
    }

    const result = await this.decryptApiKey(byokKey);

    if (result.injected && result.apiKey) {
      log.debug({ maskedKey: this.maskKey(result.apiKey) }, 'BYOK key decrypted');
      return { client };
    }

    return { client, warning: result.warning };
  }
}
