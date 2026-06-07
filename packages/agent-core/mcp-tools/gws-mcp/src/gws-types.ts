export interface AccountEntry {
  googleAccountId: string;
  label: string;
  email: string;
  tokenFilePath: string;
}

export interface TokenData {
  accessToken: string;
}

export interface ToolDef {
  name: string;
  description: string;
  servicePrefix: string;
}
