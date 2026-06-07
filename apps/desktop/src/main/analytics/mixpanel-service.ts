import Mixpanel from 'mixpanel';
import { getBuildConfig } from '../config/build-config';
import { buildCommonTrackingFields } from '../utils/tracking-context';
import type { EventParams } from './analytics-service';
import { getDeviceFingerprint, getFirstSeenAt } from './analytics-service';

let mixpanelClient: Mixpanel.Mixpanel | null = null;

export function initMixpanel(): void {
  const token = getBuildConfig().mixpanelToken;
  if (!token) return;

  mixpanelClient = Mixpanel.init(token, { geolocate: true });

  const distinctId = getDeviceFingerprint();
  const common = buildCommonTrackingFields();
  const firstSeen = getFirstSeenAt();

  mixpanelClient.people.set(distinctId, {
    $distinct_id: distinctId,
    $user_id: distinctId,
    $os: common.os_name,
    $created: firstSeen || undefined,
    first_seen_at: firstSeen || undefined,
    ga_client_id: common.ga_client_id,
    app_version: common.app_version,
    first_app_version: common.first_app_version,
    platform: common.platform,
    os_name: common.os_name,
    plan_type: common.plan_type,
  });

  console.log('[Mixpanel] Initialized with distinct_id:', `${distinctId.substring(0, 8)}...`);
}

export function trackMixpanelEvent(eventName: string, params: EventParams = {}): void {
  try {
    if (!mixpanelClient) return;

    const common = buildCommonTrackingFields();
    const distinctId = getDeviceFingerprint();

    const properties: Record<string, string | number | boolean> = {
      distinct_id: distinctId,
      ga_client_id: common.ga_client_id,
      $os: common.os_name,
      $os_version: common.os_version,
    };

    for (const [key, value] of Object.entries({ ...params, ...common })) {
      if (value !== undefined) {
        properties[key] = value;
      }
    }

    delete properties.user_id;
    properties.$user_id = distinctId;

    mixpanelClient.track(eventName, properties);
  } catch (error) {
    console.error(`[Mixpanel] Failed to track event "${eventName}":`, error);
  }
}

export function flushMixpanel(): void {}
