import type { ZaiRegion } from '@myboteam/agent-core/desktop-main';

export interface ProviderOptions {
  baseUrl?: string;
  zaiRegion?: ZaiRegion;

  region?: ZaiRegion;
  deploymentName?: string;
  authType?: string;
}

export function normalizeProviderOptions(
  raw: Record<string, unknown> | undefined,
): ProviderOptions {
  if (!raw || typeof raw !== 'object') return {};
  const opts: ProviderOptions = {};
  if (typeof raw.baseUrl === 'string') opts.baseUrl = raw.baseUrl;

  const regionValue = raw.zaiRegion ?? raw.region;
  if (typeof regionValue === 'string') opts.zaiRegion = regionValue as ZaiRegion;
  if (typeof raw.deploymentName === 'string') opts.deploymentName = raw.deploymentName;
  if (typeof raw.authType === 'string') opts.authType = raw.authType;
  return opts;
}
