export type CloudBrowserProvider = 'aws-agentcore' | 'browserbase' | 'steel';

export interface CloudBrowserProviderConfig {
  provider: CloudBrowserProvider;

  enabled: boolean;

  apiKey?: string;

  projectId?: string;

  endpoint?: string;
}

export interface CloudBrowserConfig {
  activeProvider: CloudBrowserProvider | null;

  providers: Partial<Record<CloudBrowserProvider, CloudBrowserProviderConfig>>;
}
