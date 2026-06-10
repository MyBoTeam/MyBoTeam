import { ChatCircle, FolderSimple, GearSix, Info, Key } from '@phosphor-icons/react';

export type SettingsTabId =
  | 'providers'
  | 'voice'
  | 'skills'
  | 'browsers'
  | 'workspaces'
  | 'integrations'
  | 'scheduler'
  | 'general'
  | 'about';

export const SETTINGS_TABS = [
  { id: 'providers' as const, labelKey: 'tabs.providers', icon: Key },

  {
    id: 'workspaces' as const,
    labelKey: 'tabs.workspaces',
    icon: FolderSimple,
  },
  {
    id: 'integrations' as const,
    labelKey: 'tabs.integrations',
    icon: ChatCircle,
  },

  { id: 'general' as const, labelKey: 'tabs.general', icon: GearSix },
  { id: 'about' as const, labelKey: 'tabs.about', icon: Info },
] as const;

export const FIRST_FOUR_PROVIDERS = ['openai', 'anthropic', 'google', 'bedrock'] as const;
