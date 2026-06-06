import type { ZaiRegion } from '@myboteam/agent-core/desktop-main';

/**
 * Allowed shape of the `options` parameter for provider validation.
 * Extra fields are ignored; all fields are optional.
 */
export interface ProviderOptions {
  baseUrl?: string;
  zaiRegion?: ZaiRegion;
  /** Legacy alias — normalised to zaiRegion before use */
  region?: ZaiRegion;
  deploymentName?: string;
  authType?: string;
}

/** Normalise a raw options object coming from IPC into a typed ProviderOptions. */
export function normalizeProviderOptions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any> | undefined,
): ProviderOptions {
  if (!raw || typeof raw !== 'object') return {};
  const opts: ProviderOptions = {};
  if (typeof raw.baseUrl === 'string') opts.baseUrl = raw.baseUrl;
  // Support both field names; zaiRegion wins if both are present
  const regionValue = raw.zaiRegion ?? raw.region;
  if (typeof regionValue === 'string') opts.zaiRegion = regionValue as ZaiRegion;
  if (typeof raw.deploymentName === 'string') opts.deploymentName = raw.deploymentName;
  if (typeof raw.authType === 'string') opts.authType = raw.authType;
  return opts;
}
