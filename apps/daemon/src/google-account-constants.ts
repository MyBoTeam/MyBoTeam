import type { GoogleAccountStatus } from '@myboteam/agent-core';

export const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;
export const TRANSIENT_RETRY_DELAY_MS = 60 * 1000;
export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const GWS_ACCOUNT_STATUS_CHANGED = 'gwsAccount.statusChanged' as const;

export const tokenKey = (accountId: string): string => `gws:token:${accountId}`;

export interface GoogleAccountRow {
  google_account_id: string;
  email: string;
  display_name: string;
  picture_url: string | null;
  label: string;
  status: GoogleAccountStatus;
  connected_at: string;
  last_refreshed_at: string | null;
}
