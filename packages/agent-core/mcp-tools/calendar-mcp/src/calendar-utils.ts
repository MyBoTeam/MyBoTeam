import fs from 'node:fs';
import { google } from 'googleapis';

export function createCalendarClient(tokenFilePath: string) {
  const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf-8')) as {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
  const auth = new google.auth.OAuth2();
  auth.setCredentials({
    access_token: tokenData.accessToken,
    refresh_token: tokenData.refreshToken,
    expiry_date: tokenData.expiresAt,
  });
  return google.calendar({ version: 'v3', auth });
}

export function parseFlags(parts: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('--') && i + 1 < parts.length && !parts[i + 1].startsWith('--')) {
      flags[parts[i].slice(2)] = parts[i + 1];
      i++;
    }
  }
  return flags;
}

export function formatEvent(
  evt: {
    id?: string | null;
    summary?: string | null;
    start?: { dateTime?: string | null; date?: string | null } | null;
    end?: { dateTime?: string | null; date?: string | null } | null;
    location?: string | null;
    attendees?: Array<{ email?: string | null; responseStatus?: string | null }> | null;
    conferenceData?: {
      entryPoints?: Array<{ entryPointType?: string | null; uri?: string | null }> | null;
    } | null;
    htmlLink?: string | null;
  },
  account?: string,
) {
  const videoLink = evt.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri;
  return {
    ...(account ? { account } : {}),
    eventId: evt.id,
    title: evt.summary,
    start: evt.start?.dateTime ?? evt.start?.date,
    end: evt.end?.dateTime ?? evt.end?.date,
    location: evt.location,
    attendees: evt.attendees?.map((a) => ({ email: a.email, responseStatus: a.responseStatus })),
    ...(videoLink ? { videoLink } : {}),
    ...(evt.htmlLink ? { link: evt.htmlLink } : {}),
  };
}

export function handleApiError(error: unknown, email: string): string {
  const err = error as { code?: number; status?: number; message?: string };
  const status = err.status ?? err.code;
  if (status === 401 || status === 403) {
    return `Access denied for account ${email}. Reconnect in Settings → Integrations.`;
  }
  if (status === 404) {
    return 'Event not found. It may have been deleted or is from a different account.';
  }
  return err.message ?? String(error);
}
