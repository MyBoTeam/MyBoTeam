/**
 * Metadata types and helpers for custom provider vault storage.
 *
 * @module custom-metadata
 */

import type {
  ConnectionTestResult,
  CustomProvider,
  CustomProviderStatus,
} from '@myboteam/types';
import type { VaultEntry } from '../../vault/vault-types.js';

export const VAULT_KEY_PREFIX = 'custom-provider:';

/**
 * State tracking for rate limiting.
 */
export interface RateLimitState {
  /** Number of consecutive rate limit responses */
  consecutiveRateLimits: number;
  /** ISO timestamp of last rate limit response */
  lastRateLimitAt: string | null;
  /** Whether provider is temporarily disabled due to rate limits */
  temporarilyDisabled: boolean;
}

/**
 * Metadata stored in vault for custom providers.
 */
export interface ProviderVaultMetadata {
  name: string;
  url: string;
  modelName: string;
  status: CustomProviderStatus;
  createdAt: string;
  updatedAt: string;
  lastTestedAt: string | null;
  testResult: ConnectionTestResult | null;
  rateLimitState: RateLimitState;
}

/**
 * Valid state transitions for custom provider status.
 */
const VALID_TRANSITIONS: Record<CustomProviderStatus, CustomProviderStatus[]> = {
  Active: ['Active', 'Inactive', 'Error'],
  Inactive: ['Active', 'Inactive'],
  Error: ['Active', 'Inactive', 'Error'],
};

/**
 * Checks if a state transition is valid.
 *
 * @param from - Current status
 * @param to - Target status
 * @returns True if transition is valid
 */
export function isValidStateTransition(
  from: CustomProviderStatus,
  to: CustomProviderStatus,
): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Builds a vault key for a custom provider.
 *
 * @param providerId - The provider UUID
 * @returns Vault key in format `custom-provider:{uuid}`
 */
export function buildVaultKey(providerId: string): string {
  return `${VAULT_KEY_PREFIX}${providerId}`;
}

/**
 * Creates a CustomProvider from a vault entry.
 *
 * @param entry - The vault entry
 * @param providerId - The provider UUID
 * @returns CustomProvider object (apiKey is always null for security)
 */
export function createProviderFromVault(entry: VaultEntry, providerId: string): CustomProvider {
  const meta = entry.metadata as unknown as ProviderVaultMetadata;
  return {
    id: providerId,
    name: meta.name,
    url: meta.url,
    apiKey: null,
    modelName: meta.modelName,
    status: meta.status,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    lastTestedAt: meta.lastTestedAt ? new Date(meta.lastTestedAt) : null,
    testResult: meta.testResult,
  };
}
