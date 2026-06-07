export type GoogleAccountStatus = 'connected' | 'expired' | 'error' | 'connecting';

export interface GoogleAccount {
  googleAccountId: string;
  email: string;
  displayName: string;
  pictureUrl: string | null;

  label: string;
  status: GoogleAccountStatus;
  connectedAt: string;
  lastRefreshedAt: string | null;
}

export interface GoogleAccountToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
}

export interface GwsAccountsContext {
  accounts: Array<{
    googleAccountId: string;
    label: string;
    email: string;
    tokenFilePath: string;
  }>;
  manifestFilePath: string;
}
