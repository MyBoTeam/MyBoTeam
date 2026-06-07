export const TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;

export const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export const gwsTokenKey = (accountId: string): string => `gws:token:${accountId}`;
