import type { CreditUsage } from '../common/types/gateway.js';
import type { ProviderBuildResult } from './config-provider-context.js';

export interface StorageDeps {
  readKey: (key: string) => string | null;
  writeKey: (key: string, value: string) => void;
  readGaClientId: () => string | null;
}

export interface MyboteamConnectResult {
  deviceFingerprint: string;

  usage: CreditUsage | null;

  exhausted?: boolean;

  resetsAt?: string;
}

export interface MyboteamRuntime {
  connect(deps: StorageDeps): Promise<MyboteamConnectResult>;

  disconnect(): void;

  getUsage(): Promise<CreditUsage>;

  onUsageUpdate(listener: (usage: CreditUsage) => void): () => void;

  buildProviderConfig(deps: StorageDeps): Promise<ProviderBuildResult>;

  isAvailable(): boolean;
}

const UNAVAILABLE_ERROR = 'myboteam_runtime_unavailable';

export const noopRuntime: MyboteamRuntime = {
  connect: async () => {
    throw new Error(UNAVAILABLE_ERROR);
  },
  disconnect: () => {},
  getUsage: async () => {
    throw new Error(UNAVAILABLE_ERROR);
  },
  onUsageUpdate: () => () => {},
  buildProviderConfig: async () => ({ configs: [], enableToAdd: [] }),
  isAvailable: () => false,
};
