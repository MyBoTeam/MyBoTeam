import type { ProviderType } from './provider-types.js';

export interface ModelConfig {
  id: string;
  displayName: string;
  provider: ProviderType;
  fullId: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  supportsVision?: boolean;
}

export interface SelectedModel {
  provider: ProviderType;
  model: string;
  baseUrl?: string;
  deploymentName?: string;
}

export interface OllamaModelInfo {
  id: string;
  displayName: string;
  size: number;
  toolSupport?: 'supported' | 'unsupported' | 'unknown';
}

export interface OllamaConfig {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: OllamaModelInfo[];
}

export interface AzureFoundryConfig {
  baseUrl: string;
  deploymentName: string;
  authType: 'api-key' | 'entra-id';
  enabled: boolean;
  lastValidated?: number;
}

export interface LiteLLMModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

export interface LiteLLMConfig {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: LiteLLMModel[];
}

export interface LMStudioModel {
  id: string;
  name: string;
  toolSupport: 'supported' | 'unsupported' | 'unknown';
}

export interface LMStudioConfig {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: LMStudioModel[];
}

export interface HuggingFaceLocalModelInfo {
  id: string;
  displayName: string;
  sizeBytes?: number;
  downloaded: boolean;
}

export interface HuggingFaceLocalConfig {
  selectedModelId: string | null;
  serverPort: number | null;
  enabled: boolean;
  quantization: 'q4' | 'fp32' | null;
  devicePreference: 'auto' | 'cpu' | 'cuda' | 'webgpu' | null;
}

export interface NimModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

export interface NimConfig {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: NimModel[];
}
