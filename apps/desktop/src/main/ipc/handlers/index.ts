import type { cancelGoogleOAuth, startGoogleOAuth } from '../../google-accounts/google-auth';
import { registerAnalyticsHandlers } from './analytics-handlers';
import { registerApiKeyHandlers } from './api-key-handlers';
import { registerBuiltInConnectorHandlers } from './built-in-connector-handlers';
import { registerConnectorHandlers } from './connector-handlers';
import { registerDebugHandlers } from './debug-handlers';
import { registerFavoritesHandlers } from './favorites-handlers';
import { registerFileHandlers } from './file-handlers';
import { registerGoogleAccountHandlers } from './google-account-handlers';
import { registerHuggingFaceHandlers } from './huggingface-handlers';
import { registerProviderConfigHandlers } from './provider-config-handlers';
import { registerSettingsHandlers } from './settings-handlers';
import { registerSkillsHandlers } from './skills-handlers';
import { registerSpeechHandlers } from './speech-handlers';
import { registerTaskHandlers } from './task-handlers';
import { registerWindowHandlers } from './window-handlers';
import { registerWorkspaceHandlers } from './workspace-handlers';

type GoogleAuthFn = typeof startGoogleOAuth;
type CancelGoogleOAuthFn = typeof cancelGoogleOAuth;

export function registerIPCHandlers(
  googleAuth?: GoogleAuthFn,
  cancelGoogleOAuthFn?: CancelGoogleOAuthFn,
): void {
  registerTaskHandlers();
  registerApiKeyHandlers();
  registerProviderConfigHandlers();
  registerSettingsHandlers();
  registerSpeechHandlers();
  registerDebugHandlers();
  registerFileHandlers();
  registerSkillsHandlers();
  registerFavoritesHandlers();
  registerWindowHandlers();
  registerConnectorHandlers();
  registerBuiltInConnectorHandlers();
  registerWorkspaceHandlers();
  registerHuggingFaceHandlers();
  registerAnalyticsHandlers();
  if (googleAuth && cancelGoogleOAuthFn) {
    registerGoogleAccountHandlers(googleAuth, cancelGoogleOAuthFn);
  }
}
