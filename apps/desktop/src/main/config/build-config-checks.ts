import { getBuildConfig } from './build-config-load';

export function isFreeMode(): boolean {
  return !!getBuildConfig().myboteamGatewayUrl;
}

export function isAutoUpdaterEnabled(): boolean {
  return !!getBuildConfig().myboteamUpdaterUrl;
}

export function isAnalyticsEnabled(): boolean {
  const bc = getBuildConfig();
  return !!(bc.mixpanelToken || bc.gaApiSecret || bc.sentryDsn);
}

export function getAppTier(): 'lite' | 'oss' {
  return getBuildConfig().buildEnvVersion ? 'lite' : 'oss';
}
