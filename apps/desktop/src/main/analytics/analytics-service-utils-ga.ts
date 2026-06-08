import { getBuildConfig } from '../config/build-config';
import { getAnalyticsStore } from './analytics-service-utils-store';

export interface AnalyticsConfigSchema {
  clientId: string;
  deviceFingerprint: string;
  firstSeenAt: string;
  firstLaunchVersion: string;
  firstTaskCompleted: boolean;
}

function getGaMeasurementId(): string {
  return getBuildConfig().gaMeasurementId;
}

export function getGaApiSecret(): string {
  return getBuildConfig().gaApiSecret;
}

export function isDebugMode(): boolean {
  return process.env.GA_DEBUG_MODE === '1' || process.env.GA_DEBUG_MODE === 'true';
}

export function getEndpoint(): string {
  return `https://www.google-analytics.com/mp/collect?measurement_id=${getGaMeasurementId()}&api_secret=${getGaApiSecret()}`;
}

export function isGA4Configured(): boolean {
  return !!(getAnalyticsStore().get('clientId') && getGaApiSecret() && getGaMeasurementId());
}
