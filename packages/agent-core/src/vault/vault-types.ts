export type VaultEntryType = 'api_key' | 'oauth_token' | 'credential' | 'secret';

export type SecretState = 'active' | 'expired' | 'deleted';

export interface VaultEntry {
  id: string;
  key: string;
  type: VaultEntryType;
  encryptedValue: string;
  iv: string;
  salt: string;
  tag: string;
  state: SecretState;
  expiresAt?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VaultData {
  version: string;
  salt: string;
  entries: VaultEntry[];
}

export interface TokenProvider {
  refresh(
    refreshToken: string,
    scope: string[],
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }>;
  supports(provider: string): boolean;
}
