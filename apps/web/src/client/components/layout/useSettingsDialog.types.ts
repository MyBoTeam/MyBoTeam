import type { ProviderId } from '@myboteam/agent-core/common';
import type { SettingsTabId } from './settings-tabs';

export interface UseSettingsDialogOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySaved?: () => void;
  initialProvider?: ProviderId;
  initialTab: SettingsTabId;
}
