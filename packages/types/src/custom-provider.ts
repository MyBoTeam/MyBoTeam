/**
 * Custom Provider Configuration Types
 *
 * Types for custom LLM provider configuration management.
 * Note: CustomProviderConfig (validation state) is different from upstream's
 * ProviderConfig (SDK configuration) in provider-config.ts.
 */

// Enums

export type CustomProviderStatus = 'Active' | 'Inactive' | 'Error';

export type ValidationState = 'Valid' | 'Invalid' | 'Pending';

// Entities

export interface CustomProvider {
  id: string;
  name: string;
  url: string;
  apiKey: string | null;
  modelName: string;
  status: CustomProviderStatus;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt: Date | null;
  testResult: ConnectionTestResult | null;
}

export interface ConnectionTestResult {
  id: string;
  providerId: string;
  testedAt: Date;
  success: boolean;
  error: string | null;
  responseTime: number | null;
  models: string[] | null;
}

export interface CustomProviderConfig {
  providerId: string;
  validationState: ValidationState;
  lastValidationAt: Date | null;
  validationErrors: string[];
  connectionTestResult: ConnectionTestResult | null;
}

// Request/Response Types

export interface CreateProviderRequest {
  name: string;
  url: string;
  apiKey?: string;
  modelName: string;
}

export interface CreateProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}

export type UpdatableProviderStatus = Extract<CustomProviderStatus, 'Active' | 'Inactive'>;

export interface UpdateProviderRequest {
  providerId: string;
  name?: string;
  url?: string;
  apiKey?: string;
  modelName?: string;
  status?: UpdatableProviderStatus;
}

export interface UpdateProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}

export interface DeleteProviderRequest {
  providerId: string;
}

export interface DeleteProviderResponse {
  success: boolean;
  error?: string;
}

export interface TestConnectionRequest {
  providerId: string;
  timeout?: number;
}

export interface TestConnectionResponse {
  success: boolean;
  result?: ConnectionTestResult;
  error?: string;
}

export interface ListProvidersRequest {
  status?: CustomProviderStatus;
  limit?: number;
  offset?: number;
}

export interface ListProvidersResponse {
  success: boolean;
  providers?: CustomProvider[];
  total?: number;
  error?: string;
}

export interface GetProviderRequest {
  providerId: string;
}

export interface GetProviderResponse {
  success: boolean;
  provider?: CustomProvider;
  error?: string;
}

// Error Codes

export type CustomProviderErrorCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_NAME_EXISTS'
  | 'PROVIDER_URL_EXISTS'
  | 'INVALID_URL'
  | 'INVALID_API_KEY'
  | 'MODEL_NOT_FOUND'
  | 'VALIDATION_FAILED'
  | 'INVALID_STATE_TRANSITION'
  | 'NETWORK_TIMEOUT'
  | 'DNS_RESOLUTION_FAILED'
  | 'CONNECTION_REFUSED'
  | 'SSL_ERROR'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'API_FORMAT_INVALID'
  | 'MODEL_NOT_IN_LIST';

export const CUSTOM_PROVIDER_ERRORS = {
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  PROVIDER_NAME_EXISTS: 'PROVIDER_NAME_EXISTS',
  PROVIDER_URL_EXISTS: 'PROVIDER_URL_EXISTS',
  INVALID_URL: 'INVALID_URL',
  INVALID_API_KEY: 'INVALID_API_KEY',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  DNS_RESOLUTION_FAILED: 'DNS_RESOLUTION_FAILED',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  SSL_ERROR: 'SSL_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  API_FORMAT_INVALID: 'API_FORMAT_INVALID',
  MODEL_NOT_IN_LIST: 'MODEL_NOT_IN_LIST',
} as const satisfies Record<CustomProviderErrorCode, CustomProviderErrorCode>;
