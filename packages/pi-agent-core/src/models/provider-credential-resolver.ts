export type PiProviderCredentialStatus = 'available' | 'missing';

export interface PiProviderCredentialResult {
  status: PiProviderCredentialStatus;
  providerId: string;
  apiKey?: string;
}

export interface PiProviderCredentialResolver {
  getApiKey(providerId: string): Promise<PiProviderCredentialResult>;
}

export type RuntimeApiKeyLookup = (providerId: string) => string | null | Promise<string | null>;

export function createProviderCredentialResolver(
  lookupApiKey: RuntimeApiKeyLookup,
): PiProviderCredentialResolver {
  return {
    async getApiKey(providerId: string): Promise<PiProviderCredentialResult> {
      const apiKey = await lookupApiKey(providerId);

      if (!apiKey) {
        return { status: 'missing', providerId };
      }

      return { status: 'available', providerId, apiKey };
    },
  };
}
