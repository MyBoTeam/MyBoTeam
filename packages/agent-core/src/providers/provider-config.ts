export interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

export interface RetryConfig {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
  organizationId?: string;
  customHeaders?: Record<string, string>;
  proxy?: ProxyConfig;
  retry?: RetryConfig;
  maxConcurrent?: number;
  timeout?: number;
}
