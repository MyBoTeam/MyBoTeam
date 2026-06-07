import type { CloudBrowserConfig, CloudBrowserProvider } from '@myboteam/agent-core/common';

export const PROVIDERS: {
  id: CloudBrowserProvider;
  name: string;
  description: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    required: boolean;
  }[];
}[] = [
  {
    id: 'browserbase',
    name: 'Browserbase',
    description: 'Cloud browser infrastructure with CDP support',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'bb_live_...',
        required: true,
      },
      {
        key: 'projectId',
        label: 'Project ID',
        placeholder: 'Your project ID',
        required: true,
      },
    ],
  },
  {
    id: 'steel',
    name: 'Steel',
    description: 'Managed browser sessions for AI agents',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'steel_...',
        required: true,
      },
    ],
  },
  {
    id: 'aws-agentcore',
    name: 'AWS AgentCore',
    description: 'Amazon Bedrock browser tool integration',
    fields: [
      {
        key: 'endpoint',
        label: 'Endpoint URL',
        placeholder: 'https://...',
        required: true,
      },
      {
        key: 'apiKey',
        label: 'API Key',
        placeholder: 'Your API key',
        required: false,
      },
    ],
  },
];

export const DEFAULT_CONFIG: CloudBrowserConfig = {
  activeProvider: null,
  providers: {},
};
