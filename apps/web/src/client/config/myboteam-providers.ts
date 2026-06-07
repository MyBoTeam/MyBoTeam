import type {
  ApiKeyConfig,
  BedrockCredentials,
  ToolSupportStatus,
  VertexCredentials,
} from '@myboteam/agent-core';
import type { SimpleResult, SimpleResultWithError } from './myboteam-types';

export type OllamaModel = {
  id: string;
  displayName: string;
  size: number;
  toolSupport?: ToolSupportStatus;
};
export type OllamaTestResult = { success: boolean; models?: OllamaModel[]; error?: string };
export type OllamaConfigData = {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: OllamaModel[];
} | null;
export type AzureFoundryConfigData = {
  baseUrl: string;
  deploymentName: string;
  authType: 'api-key' | 'entra-id';
  enabled: boolean;
  lastValidated?: number;
} | null;
export type AzureFoundryTestInput = {
  endpoint: string;
  deploymentName: string;
  authType: 'api-key' | 'entra-id';
  apiKey?: string;
};
export type AzureFoundrySaveInput = AzureFoundryTestInput;
export type ProviderModelFetchOptions = { baseUrl?: string; zaiRegion?: string };
export type ProviderModelFetchResult = {
  success: boolean;
  models?: Array<{ id: string; name: string }>;
  error?: string;
};
export type OpenRouterModelData = {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
};
export type OpenRouterModelFetchResult = {
  success: boolean;
  models?: OpenRouterModelData[];
  error?: string;
};
export type LiteLLMConfigData = {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: OpenRouterModelData[];
} | null;
export type LMStudioModelData = {
  id: string;
  name: string;
  toolSupport: ToolSupportStatus;
};
export type LMStudioConfigData = {
  baseUrl: string;
  enabled: boolean;
  lastValidated?: number;
  models?: LMStudioModelData[];
} | null;
export type HuggingFaceLocalConfigData = {
  selectedModelId: string | null;
  serverPort: number | null;
  enabled: boolean;
} | null;
export type HuggingFaceModelListResult = {
  cached: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
  suggested: Array<{ id: string; displayName: string; sizeBytes?: number; downloaded: boolean }>;
};
export type HuggingFaceDownloadProgressData = {
  modelId: string;
  status: 'downloading' | 'complete' | 'error';
  progress: number;
  error?: string;
};
export type HuggingFaceServerStatusData = {
  running: boolean;
  port: number | null;
  loadedModel: string | null;
  isLoading: boolean;
};
export type NimConnectionResult = OpenRouterModelFetchResult;
export type BedrockModelResult = {
  success: boolean;
  models: Array<{ id: string; name: string; provider: string }>;
  error?: string;
};
export type VertexProjectResult = { success: boolean; projectId: string | null };
export type VertexProjectListResult = {
  success: boolean;
  projects: Array<{ projectId: string; name: string }>;
  error?: string;
};

export interface MyBoTeamAPIProviders {
  testOllamaConnection(url: string): Promise<OllamaTestResult>;
  getOllamaConfig(): Promise<OllamaConfigData>;
  setOllamaConfig(config: OllamaConfigData): Promise<void>;
  getAzureFoundryConfig(): Promise<AzureFoundryConfigData>;
  setAzureFoundryConfig(config: AzureFoundryConfigData): Promise<void>;
  testAzureFoundryConnection(config: AzureFoundryTestInput): Promise<SimpleResultWithError>;
  saveAzureFoundryConfig(config: AzureFoundrySaveInput): Promise<void>;
  fetchProviderModels(
    providerId: string,
    options?: ProviderModelFetchOptions,
  ): Promise<ProviderModelFetchResult>;
  fetchOpenRouterModels(): Promise<OpenRouterModelFetchResult>;
  testLiteLLMConnection(url: string, apiKey?: string): Promise<OpenRouterModelFetchResult>;
  fetchLiteLLMModels(): Promise<OpenRouterModelFetchResult>;
  getLiteLLMConfig(): Promise<LiteLLMConfigData>;
  setLiteLLMConfig(config: LiteLLMConfigData): Promise<void>;
  testLMStudioConnection(url: string): Promise<OpenRouterModelFetchResult>;
  fetchLMStudioModels(): Promise<OpenRouterModelFetchResult>;
  getLMStudioConfig(): Promise<LMStudioConfigData>;
  setLMStudioConfig(config: LMStudioConfigData): Promise<void>;
  getHuggingFaceLocalConfig(): Promise<HuggingFaceLocalConfigData>;
  setHuggingFaceLocalConfig(config: HuggingFaceLocalConfigData): Promise<void>;
  listHuggingFaceModels(): Promise<HuggingFaceModelListResult>;
  downloadHuggingFaceModel(modelId: string): Promise<SimpleResultWithError>;
  startHuggingFaceServer(
    modelId: string,
  ): Promise<SimpleResult & { port?: number; error?: string }>;
  stopHuggingFaceServer(): Promise<SimpleResultWithError>;
  getHuggingFaceServerStatus(): Promise<HuggingFaceServerStatusData>;
  testHuggingFaceConnection(): Promise<SimpleResultWithError>;
  deleteHuggingFaceModel(modelId: string): Promise<SimpleResultWithError>;
  onHuggingFaceDownloadProgress(
    callback: (progress: HuggingFaceDownloadProgressData) => void,
  ): () => void;
  testNimConnection(url: string, apiKey: string): Promise<NimConnectionResult>;
  fetchNimModels(): Promise<NimConnectionResult>;
  testCustomConnection(baseUrl: string, apiKey?: string): Promise<SimpleResultWithError>;
  validateBedrockCredentials(credentials: string): Promise<{ valid: boolean; error?: string }>;
  saveBedrockCredentials(credentials: string): Promise<ApiKeyConfig>;
  getBedrockCredentials(): Promise<BedrockCredentials | null>;
  fetchBedrockModels(credentials: string): Promise<BedrockModelResult>;
  validateVertexCredentials(credentials: string): Promise<{ valid: boolean; error?: string }>;
  saveVertexCredentials(credentials: string): Promise<ApiKeyConfig>;
  getVertexCredentials(): Promise<VertexCredentials | null>;
  fetchVertexModels(credentials: string): Promise<BedrockModelResult>;
  detectVertexProject(): Promise<VertexProjectResult>;
  listVertexProjects(): Promise<VertexProjectListResult>;
}
