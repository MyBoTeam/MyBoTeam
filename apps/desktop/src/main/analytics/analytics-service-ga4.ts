import { net } from 'electron';
import {
  numericSessionId as _sessionNumeric,
  sessionId as _sessionUuid,
  getAnalyticsStore,
  getEndpoint,
  getGaApiSecret,
  isDebugMode,
  isGA4Configured,
} from './analytics-service-utils';

export interface EventParams {
  [key: string]: string | number | boolean | undefined;
}

interface EventMetadata {
  app_version: string;
  environment: string;
  platform: string;
  arch: string;
  session_id: number;
  trace_session_id: string;
  engagement_time_msec: number;
  os_name: string;
  os_version: string;
  timezone: string;
  user_id: string;
  plan_type: string;
  deployment_type: string;
  org_id: string;
  user_role: string;
  electron_user_agent: string;
  browser_user_agent?: string;
  first_app_version: string;
}

interface GA4Event {
  name: string;
  params: EventParams & Partial<EventMetadata>;
}

interface GA4Payload {
  client_id: string;
  user_properties?: Record<string, { value: string | number }>;
  events: GA4Event[];
}

const eventQueue: GA4Event[] = [];
let isOnline: boolean = true;

let _buildCommonTrackingFields: (() => Record<string, unknown>) | null = null;

async function getMetadata(): Promise<EventMetadata> {
  if (!_buildCommonTrackingFields) {
    const mod = await import('../utils/tracking-context');
    _buildCommonTrackingFields = mod.buildCommonTrackingFields;
  }
  const {
    ga_session_id: _s,
    ga_client_id: _c,
    first_launched_at: _f,
    ...common
  } = _buildCommonTrackingFields();
  return {
    ...(common as Omit<EventMetadata, 'session_id' | 'trace_session_id' | 'engagement_time_msec'>),
    session_id: _sessionNumeric,
    trace_session_id: _sessionUuid,
    engagement_time_msec: 100,
  };
}

async function sendToGA4(events: GA4Event[]): Promise<boolean> {
  const clientId = getAnalyticsStore().get('clientId');
  if (!clientId) {
    console.warn('[Analytics] No client ID, skipping send');
    return false;
  }

  const apiSecret = getGaApiSecret();
  if (!apiSecret) {
    console.warn('[Analytics] No API secret configured, skipping send');
    return false;
  }

  const payload: GA4Payload = {
    client_id: clientId,
    user_properties: {
      first_seen_at: { value: getAnalyticsStore().get('firstSeenAt') || '' },
    },
    events,
  };

  try {
    const jsonBody = JSON.stringify(payload);
    const response = await net.fetch(getEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonBody,
    });

    if (!response.ok) {
      console.error('[Analytics] GA4 request failed:', response.status, response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Analytics] Failed to send events:', error);
    return false;
  }
}

async function flushEventQueue(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0;

  const success = await sendToGA4(events);
  if (!success) {
    eventQueue.push(...events);
  } else {
    console.log(`[Analytics] Flushed ${events.length} queued events`);
  }
}

export async function trackGa4Event(eventName: string, params: EventParams = {}): Promise<void> {
  try {
    if (!isGA4Configured()) return;

    const metadata = await getMetadata();

    const event: GA4Event = {
      name: eventName,
      params: {
        ...params,
        ...metadata,
        ...(isDebugMode() ? { debug_mode: true } : {}),
      },
    };

    if (!isOnline) {
      eventQueue.push(event);
      console.log(`[Analytics] Queued event (offline): ${eventName}`);
      return;
    }

    const success = await sendToGA4([event]);
    if (!success) {
      eventQueue.push(event);
      console.log(`[Analytics] Queued event (send failed): ${eventName}`);
    } else {
      console.log(`[Analytics] Sent event: ${eventName}`);
    }
  } catch (error) {
    console.error(`[Analytics] Failed to track event "${eventName}":`, error);
  }
}

export function setOnlineStatus(online: boolean): void {
  const wasOffline = !isOnline;
  isOnline = online;

  if (online && wasOffline) {
    flushEventQueue();
  }
}

export function flushAnalytics(): void {
  if (eventQueue.length > 0) {
    console.log(`[Analytics] Attempting to flush ${eventQueue.length} events on quit`);
    sendToGA4([...eventQueue]).catch((err) => {
      console.error('[Analytics] Failed to flush on quit:', err);
    });
  }
}
