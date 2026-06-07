# Import Map: src/client/ internal imports only

## Legend
- `→` = imports from
- `@/` = path alias (maps to `src/client/`)
- `./` or `../` = relative path

---

## Root files

### main.tsx
- `./i18n` → i18n/index.ts (relative)
- `./router` → router.tsx (relative)
- `./styles/globals.css` (side-effect)

### router.tsx
- `./App` → App.tsx (relative)
- `./components/layout/SettingsLayout` → components/layout/SettingsLayout.tsx (relative)
- `./components/ui/RouteErrorFallback` → components/ui/RouteErrorFallback.tsx (relative)
- `./pages/ConversationsFavoritesPage` → pages/ConversationsFavoritesPage.tsx (relative)
- `./pages/ConversationsPage` → pages/ConversationsPage.tsx (relative)
- `./pages/ExamplesPage` → pages/ExamplesPage.tsx (relative)
- `./pages/Execution` → pages/Execution.tsx (relative)
- `./pages/Home` → pages/Home.tsx (relative)
- `./pages/settings/AboutPage` → pages/settings/AboutPage.tsx (relative)
- `./pages/settings/BrowsersPage` → pages/settings/BrowsersPage.tsx (relative)
- `./pages/settings/GeneralPage` → pages/settings/GeneralPage.tsx (relative)
- `./pages/settings/IntegrationsPage` → pages/settings/IntegrationsPage.tsx (relative)
- `./pages/settings/ProvidersPage` → pages/settings/ProvidersPage.tsx (relative)
- `./pages/settings/SchedulerPage` → pages/settings/SchedulerPage.tsx (relative)
- `./pages/settings/SkillsPage` → pages/settings/SkillsPage.tsx (relative)
- `./pages/settings/VoicePage` → pages/settings/VoicePage.tsx (relative)
- `./pages/settings/WorkspacesPage` → pages/settings/WorkspacesPage.tsx (relative)

### App.tsx
- `./App.components` → App.components.tsx (relative, co-located)
- `./App.types` → App.types.ts (relative, co-located)
- `./components/AuthErrorToast` → components/AuthErrorToast.tsx (relative)
- `./components/CloseConfirmDialog` → components/CloseConfirmDialog.tsx (relative)
- `./components/DaemonConnectionToast` → components/DaemonConnectionToast.tsx (relative)
- `./components/layout/AuthSettingsDialog` → components/layout/AuthSettingsDialog.tsx (relative)
- `./components/layout/Sidebar` → components/layout/Sidebar.tsx (relative)
- `./components/layout/SidebarFallback` → components/layout/SidebarFallback.tsx (relative)
- `./components/TaskLauncher` → components/TaskLauncher/index.ts (relative)
- `./components/ui/ErrorBoundary` → components/ui/ErrorBoundary.tsx (relative)
- `./lib/logger` → lib/logger.ts (relative)
- `./lib/myboteam` → lib/myboteam.ts (relative)
- `./stores/taskStore` → stores/taskStore.ts (relative)

### App.components.tsx
- `@/lib/animations` → lib/animations.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./pages/execution/AnimatedOutlet` → pages/execution/AnimatedOutlet.tsx (relative)

### App.types.ts
- _(no internal imports)_

---

## lib/

### lib/animations.ts
- _(no internal imports)_

### lib/attachments.tsx
- _(no internal imports — just imports from phosphor)_

### lib/fileUtils.ts
- _(no internal imports — just agent-core)_

### lib/glass-utils.ts
- _(no internal imports)_

### lib/hover-effects.ts
- _(no internal imports — just cva)_

### lib/logger.ts
- _(no internal imports)_

### lib/model-utils.ts
- _(no internal imports)_

### lib/myboteam-accounts.ts
- `./myboteam-types` → lib/myboteam-types.ts (relative)

### lib/myboteam-analytics.ts
- _(no internal imports)_

### lib/myboteam-connectors.ts
- _(no internal imports — just agent-core types)_

### lib/myboteam-providers.ts
- `./myboteam-types` → lib/myboteam-types.ts (relative)

### lib/myboteam-settings.ts
- `./myboteam-analytics` → lib/myboteam-analytics.ts (relative)
- `./myboteam-types` → lib/myboteam-types.ts (relative)

### lib/myboteam-tasks.ts
- `./myboteam-types` → lib/myboteam-types.ts (relative)

### lib/myboteam-types.ts
- _(no internal imports — just external)_

### lib/myboteam.ts
- `./myboteam-accounts` → lib/myboteam-accounts.ts (relative)
- `./myboteam-connectors` → lib/myboteam-connectors.ts (relative)
- `./myboteam-providers` → lib/myboteam-providers.ts (relative)
- `./myboteam-settings` → lib/myboteam-settings.ts (relative)
- `./myboteam-tasks` → lib/myboteam-tasks.ts (relative)

### lib/platform.ts
- _(no internal imports)_

### lib/provider-logos.ts
- _(no internal imports — just asset imports)_

### lib/task-utils.ts
- _(no internal imports)_

### lib/theme-color.ts
- _(no internal imports)_

### lib/theme-core.ts
- `./theme-color.js` → lib/theme-color.ts (relative, with .js ext)

### lib/theme.ts
- `./myboteam` → lib/myboteam.ts (relative)
- `./theme-core` → lib/theme-core.ts (relative)

### lib/utils.ts
- _(no internal imports — just external)_

### lib/waiting-detection.ts
- _(no internal imports)_

---

## stores/

### stores/taskStore.ts
- `./task-execution-actions` → stores/task-execution-actions.ts (relative)
- `./task-history-actions` → stores/task-history-actions.ts (relative)
- `./task-setup-actions` → stores/task-setup-actions.ts (relative)
- `./task-subscriptions` → stores/task-subscriptions.ts (relative)

### stores/task-execution-actions.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./task-lifecycle-actions` → stores/task-lifecycle-actions.ts (relative)
- `./task-permission-actions` → stores/task-permission-actions.ts (relative)
- `./task-state-helpers` → stores/task-state-helpers.ts (relative)
- `./task-update-actions` → stores/task-update-actions.ts (relative)
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-history-actions.ts
- `../lib/logger` → lib/logger.ts (relative)
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./task-state-helpers` → stores/task-state-helpers.ts (relative)
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-lifecycle-actions.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./task-state-helpers` → stores/task-state-helpers.ts (relative)
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-permission-actions.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./task-state-helpers` → stores/task-state-helpers.ts (relative)
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-setup-actions.ts
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-state-helpers.ts
- `./taskStore` → stores/taskStore.ts (relative)

### stores/task-subscriptions.ts
- `../lib/logger` → lib/logger.ts (relative)
- `./task-state-helpers` → stores/task-state-helpers.ts (relative)

### stores/task-update-actions.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./taskStore` → stores/taskStore.ts (relative)

### stores/daemonStore.ts
- _(no internal imports)_

### stores/sidebarStore.ts
- _(no internal imports — just zustand)_

### stores/workspaceStore.ts
- `../lib/logger` → lib/logger.ts (relative)
- `../lib/myboteam` → lib/myboteam.ts (relative)

### stores/googleAccountStore.ts
- `../lib/logger` → lib/logger.ts (relative)

---

## hooks/

### hooks/useTypingPlaceholder.ts
- _(no internal imports — just react)_

### hooks/useTheme.ts
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/lib/theme` → lib/theme.ts (via @/)
- `@/lib/theme-color` → lib/theme-color.ts (via @/)

### hooks/useCreditsState.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)

### hooks/useSettings.ts
- `@/components/settings/hooks/useProviderSettings` → components/settings/hooks/useProviderSettings.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### hooks/useTaskInputDragDrop.ts
- `@/lib/fileUtils` → lib/fileUtils.ts (via @/)

### hooks/useSpeechInput.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./use-speech-input-shortcuts` → hooks/use-speech-input-shortcuts.ts (relative)
- `./use-speech-input-utils` → hooks/use-speech-input-utils.ts (relative)
- `./useSpeechRecorder` → hooks/useSpeechRecorder.ts (relative)

### hooks/useSpeechRecorder.ts
- `./speech-types` → hooks/speech-types.ts (relative)

### hooks/use-speech-input-utils.ts
- `../lib/myboteam` → lib/myboteam.ts (relative)
- `./speech-types` → hooks/speech-types.ts (relative)

### hooks/use-speech-input-shortcuts.ts
- _(no internal imports — just react)_

### hooks/speech-types.ts
- _(no internal imports)_

### hooks/useSlashCommand.ts
- `@/lib/logger` → lib/logger.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./useSlashCommandFilter` → hooks/useSlashCommandFilter.ts (relative)

### hooks/useSlashCommandFilter.ts
- _(no internal imports)_

### hooks/useTaskInputBehavior.ts
- _(no internal imports — just react)_

---

## i18n/

### i18n/index.ts
- `../lib/logger` → lib/logger.ts (relative)
- `./locales/en` → i18n/locales/en.ts (relative)
- `./locales/fr` → i18n/locales/fr.ts (relative)
- `./locales/ru` → i18n/locales/ru.ts (relative)
- `./locales/zh-CN` → i18n/locales/zh-CN.ts (relative)

### i18n/locales/en.ts
_(no internal imports — just @locales/*.json)_

### i18n/locales/fr.ts, ru.ts, zh-CN.ts
_(same pattern as en.ts)_

---

## constants/

### constants/tool-mappings.ts
_(no internal imports — just phosphor-icons)_

---

## robot/

### robot/FloatingRobot.tsx
- `./FloatingRobot.css` (side-effect, relative)

---

## pages/

### pages/Home.tsx
- `@/components/landing/PlusMenu` → components/landing/PlusMenu/index.tsx (via @/)
- `@/components/landing/TaskInputBar` → components/landing/TaskInputBar.tsx (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `@/robot/FloatingRobot` → robot/FloatingRobot.tsx (via @/)
- `./home/useHomePage` → pages/home/useHomePage.ts (relative)

### pages/Home.tsx → pages/home/ .tsx
### pages/Execution.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/card` → components/ui/card.tsx (via @/)
- `../components/execution/CreditExhaustedChatBanner` → components/execution/CreditExhaustedChatBanner.tsx (relative)
- `../components/execution/DebugPanel` → components/execution/DebugPanel.tsx (relative)
- `../components/execution/SpinningIcon` → components/execution/SpinningIcon.tsx (relative)
- `../components/ui/ErrorBoundary` → components/ui/ErrorBoundary.tsx (relative)
- `../components/ui/ModelIndicator` → components/ui/ModelIndicator.tsx (relative)
- `../hooks/useCreditsState` → hooks/useCreditsState.ts (relative)
- `./execution/BrowserInstallModal` → pages/execution/BrowserInstallModal.tsx (relative)
- `./execution/ConversationView` → pages/execution/ConversationView.tsx (relative)
- `./execution/ExecutionCompleteFooter` → pages/execution/ExecutionCompleteFooter.tsx (relative)
- `./execution/ExecutionHeader` → pages/execution/ExecutionHeader.tsx (relative)
- `./execution/execution-utils` → pages/execution/execution-utils.ts (relative)
- `./execution/FollowUpInput` → pages/execution/FollowUpInput.tsx (relative)
- `./execution/QueuedState` → pages/execution/QueuedState.tsx (relative)
- `./execution/useExecutionPage` → pages/execution/useExecutionPage.ts (relative)

### pages/History.tsx
- `../components/history/TaskHistory` → components/history/TaskHistory.tsx (relative)
- `../components/layout/Header` → components/layout/Header.tsx (relative)
- `../stores/taskStore` → stores/taskStore.ts (relative)

### pages/ConversationsPage.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/scroll-area` → components/ui/scroll-area.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/stores/taskStore` → stores/taskStore.ts (via @/)
- `../components/layout/ConversationListItem` → components/layout/ConversationListItem.tsx (relative)

### pages/ConversationsFavoritesPage.tsx
- `@/stores/taskStore` → stores/taskStore.ts (via @/)
- `./ConversationsPage` → pages/ConversationsPage.tsx (relative)
- `./home/FavoritesSection` → pages/home/FavoritesSection.tsx (relative)
- `./home/homeConstants` → pages/home/homeConstants.ts (relative)

### pages/ExamplesPage.tsx
- `./home/ExamplesSection` → pages/home/ExamplesSection.tsx (relative)
- `./home/homeConstants` → pages/home/homeConstants.ts (relative)

### pages/home/useHomePage.ts
- `@/lib/logger` → lib/logger.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/stores/taskStore` → stores/taskStore.ts (via @/)
- `./homeConstants` → pages/home/homeConstants.ts (relative)
- `./usePromptAttachments` → pages/home/usePromptAttachments.ts (relative)

### pages/home/usePromptAttachments.ts
- `@/lib/fileUtils` → lib/fileUtils.ts (via @/)

### pages/home/FavoritesSection.tsx
- `@/lib/animations` → lib/animations.ts (via @/)
- `./useHomePage` → pages/home/useHomePage.ts (relative) [for FAVORITES_PREVIEW_COUNT]

### pages/home/ExamplesSection.tsx
- `@/components/landing/IntegrationIcons` → components/landing/IntegrationIcons.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)

### pages/home/homeConstants.ts
_(no internal imports)_

### pages/settings/GeneralPage.tsx
- `@/components/settings/GeneralTab` → components/settings/GeneralTab.tsx (via @/)
- `@/hooks/useSettings` → hooks/useSettings.ts (via @/)

### pages/settings/ProvidersPage.tsx
- `@/components/layout/settings-tabs` → components/layout/settings-tabs.ts (via @/)
- `@/components/settings/ProviderGrid` → components/settings/ProviderGrid.tsx (via @/)
- `@/components/settings/ProviderSettingsPanel` → components/settings/ProviderSettingsPanel.tsx (via @/)
- `@/components/settings/SandboxSection` → components/settings/SandboxSection.tsx (via @/)
- `@/hooks/useSettings` → hooks/useSettings.ts (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)

### pages/settings/IntegrationsPage.tsx
- `@/components/settings/integrations` → components/settings/integrations/index.ts (via @/)

### pages/settings/VoicePage.tsx
- `@/components/settings/SpeechSettingsForm` → components/settings/SpeechSettingsForm.tsx (via @/)

### pages/settings/SkillsPage.tsx
- `@/components/settings/skills` → components/settings/skills/index.ts (via @/)

### pages/settings/SchedulerPage.tsx
- `@/components/settings/scheduler` → components/settings/scheduler/index.ts (via @/)

### pages/settings/WorkspacesPage.tsx
- `@/components/settings/WorkspacesPanel` → components/settings/WorkspacesPanel.tsx (via @/)

### pages/settings/BrowsersPage.tsx
- `@/components/settings/CloudBrowsersPanel` → components/settings/CloudBrowsersPanel.tsx (via @/)

### pages/settings/AboutPage.tsx
- `@/components/settings/AboutTab` → components/settings/AboutTab.tsx (via @/)

### pages/execution/useExecutionPage.ts
- `./useExecutionActions` → pages/execution/useExecutionActions.ts (relative)
- `./useExecutionCore` → pages/execution/useExecutionCore.ts (relative)

### pages/execution/useExecutionCore.ts
- `../../hooks/useSlashCommand` → hooks/useSlashCommand.ts (relative)
- `../../hooks/useSpeechInput` → hooks/useSpeechInput.ts (relative)
- `../../lib/myboteam` → lib/myboteam.ts (relative)
- `../../stores/taskStore` → stores/taskStore.ts (relative)
- `./useExecutionAttachments` → pages/execution/useExecutionAttachments.ts (relative)
- `./useExecutionDebugState` → pages/execution/useExecutionDebugState.ts (relative)
- `./useExecutionEvents` → pages/execution/useExecutionEvents.ts (relative)
- `./useExecutionScroll` → pages/execution/useExecutionScroll.ts (relative)

### pages/execution/useExecutionActions.ts
- `../../lib/logger` → lib/logger.ts (relative)
- `./useExecutionCore` → pages/execution/useExecutionCore.ts (relative, type-only)
- `./useExecutionEffects` → pages/execution/useExecutionEffects.ts (relative)
- `./useExecutionPauseActions` → pages/execution/useExecutionPauseActions.ts (relative)

### pages/execution/useExecutionPauseActions.ts
- `./useExecutionCore` → pages/execution/useExecutionCore.ts (relative, type-only)

### pages/execution/useExecutionEffects.ts
- `./useExecutionCore` → pages/execution/useExecutionCore.ts (relative, type-only)

### pages/execution/useExecutionEvents.ts
- `../../components/execution/DebugPanel` → components/execution/DebugPanel.tsx (relative, type-only)
- `../../lib/myboteam` → lib/myboteam.ts (relative, type-only)
- `../../stores/taskStore` → stores/taskStore.ts (relative)

### pages/execution/useExecutionAttachments.ts
- `../../lib/fileUtils` → lib/fileUtils.ts (relative)
- `../../lib/logger` → lib/logger.ts (relative)
- `../../lib/myboteam` → lib/myboteam.ts (relative, type-only)

### pages/execution/useExecutionDebugState.ts
- `../../components/execution/DebugPanel` → components/execution/DebugPanel.tsx (relative, type-only)
- `../../lib/logger` → lib/logger.ts (relative)

### pages/execution/useExecutionScroll.ts
_(no internal imports — just react)_

### pages/execution/ConversationView.tsx
- `../../components/execution/BrowserPreview` → components/execution/BrowserPreview.tsx (relative)
- `../../components/execution/MessageList` → components/execution/MessageList.tsx (relative)
- `../../components/execution/PermissionDialog` → components/execution/PermissionDialog.tsx (relative)
- `../../components/execution/ToolProgress` → components/execution/ToolProgress.tsx (relative)
- `../../components/TodoSidebar` → components/TodoSidebar.tsx (relative)
- `../../lib/animations` → lib/animations.ts (relative)
- `../../lib/waiting-detection` → lib/waiting-detection.ts (relative)
- `./types` → pages/execution/types.ts (relative, type-only)

### pages/execution/ExecutionHeader.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `./StatusBadge` → pages/execution/StatusBadge.tsx (relative)

### pages/execution/ExecutionCompleteFooter.tsx
- `@/components/ui/alert` → components/ui/alert.tsx (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/StarButton` → components/ui/StarButton.tsx (via @/)
- `../../lib/task-utils` → lib/task-utils.ts (relative)
- `../../stores/taskStore` → stores/taskStore.ts (relative)
- `./executionStatusUtils` → pages/execution/executionStatusUtils.ts (relative)

### pages/execution/BrowserInstallModal.tsx
- `@/components/ui/card` → components/ui/card.tsx (via @/)
- `../../lib/animations` → lib/animations.ts (relative)

### pages/execution/FollowUpInput.tsx
- `@/components/ui/alert` → components/ui/alert.tsx (via @/)
- `../../components/landing/SlashCommandPopover` → components/landing/SlashCommandPopover.tsx (relative)
- `../../hooks/useSlashCommand` → hooks/useSlashCommand.ts (relative, type-only)
- `../../hooks/useSpeechInput` → hooks/useSpeechInput.ts (relative, type-only)
- `./FollowUpAttachments` → pages/execution/FollowUpAttachments.tsx (relative)
- `./FollowUpToolbar` → pages/execution/FollowUpToolbar.tsx (relative)

### pages/execution/FollowUpToolbar.tsx
- `../../components/landing/PlusMenu` → components/landing/PlusMenu/index.tsx (relative)
- `../../components/ui/ModelIndicator` → components/ui/ModelIndicator.tsx (relative)
- `../../components/ui/SpeechInputButton` → components/ui/SpeechInputButton.tsx (relative)
- `../../hooks/useSpeechInput` → hooks/useSpeechInput.ts (relative, type-only)

### pages/execution/FollowUpAttachments.tsx
- `../../lib/attachments` → lib/attachments.tsx (relative)
- `./DragOverlay` → pages/execution/DragOverlay.tsx (relative, re-export)

### pages/execution/QueuedState.tsx
- `@/components/execution/MessageList` → components/execution/MessageList.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `./QueuedEmptyState` → pages/execution/QueuedEmptyState.tsx (relative, re-export)

### pages/execution/QueuedEmptyState.tsx
- `@/lib/animations` → lib/animations.ts (via @/)

### pages/execution/DragOverlay.tsx
_(no internal imports — just react-i18next)_

### pages/execution/StatusBadge.tsx
_(no internal imports — just react-i18next + phosphor)_

### pages/execution/AnimatedOutlet.tsx
_(no internal imports — just react + react-router)_

### pages/execution/types.ts
_(no internal imports)_

### pages/execution/execution-utils.ts
_(no internal imports)_

### pages/execution/executionStatusUtils.ts
_(no internal imports)_

---

## components/

### components/AuthErrorToast.tsx
- `./ui/button` → components/ui/button.tsx (relative)

### components/CloseConfirmDialog.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/DaemonConnectionToast.tsx
- `@/stores/daemonStore` → stores/daemonStore.ts (via @/)
- `./ui/button` → components/ui/button.tsx (relative)

### components/DaemonStatusDot.tsx
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/stores/daemonStore` → stores/daemonStore.ts (via @/)

### components/ActionChip.tsx
- `./BrowserScriptCardHelpers` → components/BrowserScriptCardHelpers.tsx (relative)

### components/BrowserScriptCardHelpers.tsx
- `./ActionChip` → components/ActionChip.tsx (relative, re-export)
- `./Arrow` → components/Arrow.tsx (relative, re-export)

### components/Arrow.tsx
_(no internal imports — just phosphor)_

### components/SpinningIcon.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/StatusIcon.tsx
_(no internal imports — just react + phosphor)_

### components/TodoListItem.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./StatusIcon` → components/StatusIcon.tsx (relative)

### components/TodoSidebar.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./TodoListItem` → components/TodoListItem.tsx (relative)

### components/BrowserScriptCard.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `../lib/animations` → lib/animations.ts (relative)
- `./BrowserScriptCardHelpers` → components/BrowserScriptCardHelpers.tsx (relative)
- `./SpinningIcon` → components/SpinningIcon.tsx (relative)

### components/TaskLauncher/index.ts
_(re-exports from TaskLauncher.tsx?)_

### components/TaskLauncher/TaskLauncher.tsx
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/stores/taskStore` → stores/taskStore.ts (via @/)
- `./TaskLauncherContent` → components/TaskLauncher/TaskLauncherContent.tsx (relative)

### components/TaskLauncher/TaskLauncherContent.tsx
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `./TaskLauncherItem` → components/TaskLauncher/TaskLauncherItem.tsx (relative)

### components/TaskLauncher/TaskLauncherItem.tsx
- `@/components/landing/IntegrationIcons` → components/landing/IntegrationIcons.tsx (via @/)
- `@/lib/task-utils` → lib/task-utils.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/history/TaskHistory.tsx
- `../../stores/taskStore` → stores/taskStore.ts (relative)
- `./TaskHistoryItem` → components/history/TaskHistoryItem.tsx (relative)

### components/history/TaskHistoryItem.tsx
- `../../lib/task-utils` → lib/task-utils.ts (relative)
- `../ui/StarButton` → components/ui/StarButton.tsx (relative)

### components/layout/Header.tsx
- `../ui/ThemeToggle` → components/ui/ThemeToggle.tsx (relative)
- `./NavLink` → components/layout/NavLink.tsx (relative)

### components/layout/Sidebar.tsx
- `@/components/DaemonStatusDot` → components/DaemonStatusDot.tsx (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/ThemeColorSelector` → components/ui/ThemeColorSelector.tsx (via @/)
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `@/stores/sidebarStore` → stores/sidebarStore.ts (via @/)
- `./NavItem` → components/layout/NavItem.tsx (relative)
- `./WorkspaceSelector` → components/layout/WorkspaceSelector.tsx (relative)

### components/layout/SidebarFallback.tsx
_(no internal imports)_

### components/layout/SettingsLayout.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `@/stores/sidebarStore` → stores/sidebarStore.ts (via @/)
- `./settings-tabs` → components/layout/settings-tabs.ts (relative)

### components/layout/AuthSettingsDialog.tsx
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `@/pages/settings/ProvidersPage` → pages/settings/ProvidersPage.tsx (via @/)

### components/layout/SettingsDialog.tsx
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `./SettingsDialogContent` → components/layout/SettingsDialogContent.tsx (relative)
- `./settings-tabs` → components/layout/settings-tabs.ts (relative)
- `./useSettingsDialog` → components/layout/useSettingsDialog.ts (relative)

### components/layout/SettingsDialogContent.tsx
- `@/components/settings/AboutTab` → components/settings/AboutTab.tsx (via @/)
- `@/components/settings/CloudBrowsersPanel` → components/settings/CloudBrowsersPanel.tsx (via @/)
- `@/components/settings/GeneralTab` → components/settings/GeneralTab.tsx (via @/)
- `@/components/settings/integrations` → components/settings/integrations/index.ts (via @/)
- `@/components/settings/ProviderGrid` → components/settings/ProviderGrid.tsx (via @/)
- `@/components/settings/ProviderSettingsPanel` → components/settings/ProviderSettingsPanel.tsx (via @/)
- `@/components/settings/SandboxSection` → components/settings/SandboxSection.tsx (via @/)
- `@/components/settings/SpeechSettingsForm` → components/settings/SpeechSettingsForm.tsx (via @/)
- `@/components/settings/scheduler` → components/settings/scheduler/index.ts (via @/)
- `@/components/settings/skills` → components/settings/skills/index.ts (via @/)
- `@/components/settings/WorkspacesPanel` → components/settings/WorkspacesPanel.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `./settings-tabs` → components/layout/settings-tabs.ts (relative)
- `./useSettingsDialog` → components/layout/useSettingsDialog.ts (relative, type-only)

### components/layout/settings-tabs.ts
_(no internal imports — just phosphor)_

### components/layout/useSettingsDialog.ts
- `@/components/settings/hooks/useProviderSettings` → components/settings/hooks/useProviderSettings.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./useSettingsDialog.types` → components/layout/useSettingsDialog.types.ts (relative, type-only)
- `./useSettingsDialogEffects` → components/layout/useSettingsDialogEffects.ts (relative)

### components/layout/useSettingsDialog.types.ts
- `./settings-tabs` → components/layout/settings-tabs.ts (relative, type-only)

### components/layout/useSettingsDialogEffects.ts
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./settings-tabs` → components/layout/settings-tabs.ts (relative)

### components/layout/NavItem.tsx
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/layout/NavLink.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/layout/ConversationListItem.tsx
- `@/components/landing/IntegrationIcons` → components/landing/IntegrationIcons.tsx (via @/)
- `@/lib/task-utils` → lib/task-utils.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `@/stores/taskStore` → stores/taskStore.ts (via @/)
- `@/stores/workspaceStore` → stores/workspaceStore.ts (via @/)

### components/layout/WorkspaceSelector.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)
- `@/stores/workspaceStore` → stores/workspaceStore.ts (via @/)

---

### components/landing/IntegrationIcons.tsx
_(no internal imports — just asset imports)_

### components/landing/PlusMenu/index.tsx
- `@/components/skills/CreateSkillModal` → components/skills/CreateSkillModal.tsx (via @/)
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)
- `@/lib/logger` → lib/logger.ts (via @/)
- `./PlusMenuItems` → components/landing/PlusMenu/PlusMenuItems.tsx (relative)

### components/landing/PlusMenu/PlusMenuItems.tsx
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)
- `@/components/ui/dropdown-menu-sub` → components/ui/dropdown-menu-sub.tsx (via @/)
- `./ConnectorsSubmenu` → components/landing/PlusMenu/ConnectorsSubmenu.tsx (relative)
- `./SkillsSubmenu` → components/landing/PlusMenu/SkillsSubmenu.tsx (relative)

### components/landing/PlusMenu/SkillsSubmenu.tsx
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)
- `@/components/ui/input` → components/ui/input.tsx (via @/)

### components/landing/PlusMenu/ConnectorsSubmenu.tsx
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)

### components/landing/TaskInputBar.tsx
- `@/components/ui/alert` → components/ui/alert.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `./TaskInputAttachmentList` → components/landing/TaskInputAttachmentList.tsx (relative)
- `./TaskInputTextarea` → components/landing/TaskInputTextarea.tsx (relative)
- `./TaskInputToolbar` → components/landing/TaskInputToolbar.tsx (relative)
- `./useTaskInputBar` → components/landing/useTaskInputBar.ts (relative)
- `./FileTypeIcon` → components/landing/FileTypeIcon.tsx (relative, re-export)

### components/landing/useTaskInputBar.ts
- `@/hooks/useSlashCommand` → hooks/useSlashCommand.ts (via @/)
- `@/hooks/useSpeechInput` → hooks/useSpeechInput.ts (via @/)
- `@/hooks/useTaskInputBehavior` → hooks/useTaskInputBehavior.ts (via @/)
- `@/hooks/useTaskInputDragDrop` → hooks/useTaskInputDragDrop.ts (via @/)
- `@/hooks/useTypingPlaceholder` → hooks/useTypingPlaceholder.ts (via @/)
- `@/lib/logger` → lib/logger.ts (via @/)

### components/landing/TaskInputTextarea.tsx
- `@/components/landing/SlashCommandPopover` → components/landing/SlashCommandPopover.tsx (via @/)
- `@/hooks/useSlashCommand` → hooks/useSlashCommand.ts (via @/, type-only)

### components/landing/TaskInputToolbar.tsx
- `@/components/ui/ModelIndicator` → components/ui/ModelIndicator.tsx (via @/)
- `@/components/ui/SpeechInputButton` → components/ui/SpeechInputButton.tsx (via @/)
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/hooks/useSpeechInput` → hooks/useSpeechInput.ts (via @/, type-only)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/landing/TaskInputAttachmentList.tsx
- `@/lib/fileUtils` → lib/fileUtils.ts (via @/)
- `./FileTypeIcon` → components/landing/FileTypeIcon.tsx (relative)

### components/landing/FileTypeIcon.tsx
_(no internal imports — just phosphor)_

### components/landing/SlashCommandPopover.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./caretPosition` → components/landing/caretPosition.ts (relative)

### components/landing/caretPosition.ts
_(no internal imports)_

---

### components/execution/BrowserPreview.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `../../lib/animations` → lib/animations.ts (relative)
- `./PreviewBody` → components/execution/PreviewBody.tsx (relative)
- `./StatusBadge` → components/execution/StatusBadge.tsx (relative)
- `./useBrowserPreview` → components/execution/useBrowserPreview.ts (relative)

### components/execution/PreviewBody.tsx
- `./StatusBadge` → components/execution/StatusBadge.tsx (relative, type-only)

### components/execution/StatusBadge.tsx (execution)
_(no internal imports)_

### components/execution/useBrowserPreview.ts
- `./browserPreviewState` → components/execution/browserPreviewState.ts (relative)
- `./StatusBadge` → components/execution/StatusBadge.tsx (relative, type-only)
- `./useBrowserPreviewIpc` → components/execution/useBrowserPreviewIpc.ts (relative)

### components/execution/browserPreviewState.ts
- `./StatusBadge` → components/execution/StatusBadge.tsx (relative, type-only)

### components/execution/useBrowserPreviewIpc.ts
- `./StatusBadge` → components/execution/StatusBadge.tsx (relative, type-only)

### components/execution/BrowserPreview → chain: StatusBadge, PreviewBody, useBrowserPreview, useBrowserPreviewIpc, browserPreviewState
### components/execution/DebugPanel.tsx
- `./DebugLogList` → components/execution/DebugLogList.tsx (relative)
- `./DebugPanelHeader` → components/execution/DebugPanelHeader.tsx (relative)

### components/execution/DebugLogList.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./DebugPanel` → components/execution/DebugPanel.tsx (relative, type-only)

### components/execution/DebugPanelHeader.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `./DebugPanel` → components/execution/DebugPanel.tsx (relative, type-only)

### components/execution/MessageList.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `../../constants/tool-mappings` → constants/tool-mappings.ts (relative)
- `../../lib/animations` → lib/animations.ts (relative)
- `../BrowserScriptCard` → components/BrowserScriptCard.tsx (relative)
- `../ui/streaming-text` → components/ui/streaming-text.tsx (relative)
- `./MessageCopyButton` → components/execution/MessageCopyButton.tsx (relative)
- `./MessageTaskAction` → components/execution/MessageTaskAction.tsx (relative)
- `./message-markdown-config` → components/execution/message-markdown-config.tsx (relative)
- `./SpinningIcon` → components/execution/SpinningIcon.tsx (relative)

### components/execution/MessageCopyButton.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/execution/MessageTaskAction.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)

### components/execution/message-markdown-config.tsx
- `@/components/ui/CodeBlock` → components/ui/CodeBlock.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/execution/SpinningIcon.tsx (execution)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/execution/ToolProgress.tsx
- `../../constants/tool-mappings` → constants/tool-mappings.ts (relative)
- `../../lib/animations` → lib/animations.ts (relative)
- `./SpinningIcon` → components/execution/SpinningIcon.tsx (relative)

### components/execution/PermissionDialog.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/card` → components/ui/card.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `../../lib/animations` → lib/animations.ts (relative)
- `./PermissionDialogFile` → components/execution/PermissionDialogFile.tsx (relative)
- `./PermissionDialogQuestion` → components/execution/PermissionDialogQuestion.tsx (relative)
- `./PermissionDialogTool` → components/execution/PermissionDialogTool.tsx (relative)
- `./permission-utils` → components/execution/permission-utils.ts (relative)

### components/execution/PermissionDialogFile.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./permission-utils` → components/execution/permission-utils.ts (relative)

### components/execution/PermissionDialogQuestion.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/execution/PermissionDialogTool.tsx
_(no internal imports)_

### components/execution/permission-utils.ts
_(no internal imports)_

### components/execution/CreditExhaustedChatBanner.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `../../lib/animations` → lib/animations.ts (relative)

### components/execution/DebugPanel → DebugLogList, DebugPanelHeader
### components/execution/DebugLogList → refers to DebugPanel (type)
### components/execution/DebugPanelHeader → refers to DebugPanel (type)

---

### components/ui/ (shadcn/ui + custom)

### components/ui/alert.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/avatar.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/badge.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/button.tsx
- `@/lib/glass-utils` → lib/glass-utils.ts (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/card.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/CodeBlock.tsx
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/dialog.tsx
- `@/lib/glass-utils` → lib/glass-utils.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/dropdown-menu-sub.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/dropdown-menu.tsx
- `@/lib/utils` → lib/utils.ts (via @/)
- `./dropdown-menu.types` → components/ui/dropdown-menu.types.ts (relative)

### components/ui/dropdown-menu.types.ts
_(no internal imports)_

### components/ui/ErrorBoundary.tsx
- `./button` → components/ui/button.tsx (relative)

### components/ui/RouteErrorFallback.tsx
- `./button` → components/ui/button.tsx (relative)

### components/ui/input.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/label.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/ModelIndicator.tsx
- `@/components/settings/hooks/useProviderSettings` → components/settings/hooks/useProviderSettings.ts (via @/)
- `@/components/ui/ProviderSubMenu` → components/ui/ProviderSubMenu.tsx (via @/)
- `@/lib/logger` → lib/logger.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `./ModelIndicator.types` → components/ui/ModelIndicator.types.ts (relative, type-only)

### components/ui/ModelIndicator.types.ts
_(no internal imports)_

### components/ui/ProviderIcon.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/ProviderSubMenu.tsx
- `@/components/ui/dropdown-menu` → components/ui/dropdown-menu.tsx (via @/)
- `@/components/ui/ProviderIcon` → components/ui/ProviderIcon.tsx (via @/)

### components/ui/scroll-area.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/searchable-select.tsx
- `@/components/ui/searchable-select-parts` → components/ui/searchable-select-parts.tsx (via @/)

### components/ui/searchable-select-parts.tsx
- `@/lib/animations` → lib/animations.ts (via @/)

### components/ui/separator.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/skeleton.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/SpeechInputButton.tsx
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/platform` → lib/platform.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `./speech-input-button-types` → components/ui/speech-input-button-types.ts (relative, type-only)
- `./speechInputHelpers` → components/ui/speechInputHelpers.tsx (relative)

### components/ui/speech-input-button-types.ts
_(no internal imports)_

### components/ui/speechInputHelpers.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/StarButton.tsx
_(no internal imports — just phosphor)_

### components/ui/streaming-text.tsx
_(no internal imports — just react)_

### components/ui/switch.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/tabs.tsx
_(no internal imports — just radix)_

### components/ui/textarea.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/ThemeColorSelector.tsx
- `@/hooks/useTheme` → hooks/useTheme.ts (via @/)
- `@/lib/theme-color` → lib/theme-color.ts (via @/, type-only)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/ThemeToggle.tsx
- `@/components/ui/tooltip` → components/ui/tooltip.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `../../hooks/useTheme` → hooks/useTheme.ts (relative)

### components/ui/tooltip.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/alert.tsx
- `@/components/ui/alert` → components/ui/alert.tsx (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/avatar.tsx
- `@/components/ui/avatar` → components/ui/avatar.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/badge.tsx
- `@/components/ui/badge` → components/ui/badge.tsx (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/button.tsx
_(just re-exports from base button)_

### components/ui/glass/card.tsx
- `@/lib/glass-utils` → lib/glass-utils.ts (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/dialog.tsx
- `@/lib/glass-utils` → lib/glass-utils.ts (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/dropdown-menu.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/input.tsx
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `@/lib/glass-utils` → lib/glass-utils.ts (via @/)
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/label.tsx
- `@/components/ui/label` → components/ui/label.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/scroll-area.tsx
- `@/components/ui/scroll-area` → components/ui/scroll-area.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/separator.tsx
- `@/components/ui/separator` → components/ui/separator.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/skeleton.tsx
- `@/components/ui/skeleton` → components/ui/skeleton.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/switch.tsx
- `@/components/ui/switch` → components/ui/switch.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/tabs.tsx
- `@/lib/hover-effects` → lib/hover-effects.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/textarea.tsx
- `@/components/ui/textarea` → components/ui/textarea.tsx (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/ui/glass/tooltip.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

---

### components/settings/AboutTab.tsx
_(re-read needed — see grep output above)_

### components/settings/AddNoteForm.tsx
_(no internal imports in component)_

### components/settings/CloudBrowserProviderRow.tsx
_(re-read needed)_

### components/settings/CloudBrowsersPanel.tsx
_(re-read needed)_

### components/settings/cloud-browsers-constants.ts
_(no internal imports)_

### components/settings/ColorPicker.tsx
_(no internal imports)_

### components/settings/daemon-utils.ts
_(no internal imports)_

### components/settings/DaemonSection.tsx
_(re-read needed)_

### components/settings/DebugSection.tsx
_(re-read needed)_

### components/settings/GeneralTab.tsx
- `./LanguageSelector` → components/settings/LanguageSelector.tsx (relative)
- `./NotificationsSection` → components/settings/NotificationsSection.tsx (relative)
- `./ThemeSelector` → components/settings/ThemeSelector.tsx (relative)
- `./SpeechSettingsForm` → components/settings/SpeechSettingsForm.tsx (relative)

### components/settings/hooks/useProviderSettings.ts
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/settings/KnowledgeNotesPanel.tsx
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./AddNoteForm` → components/settings/AddNoteForm.tsx (relative)
- `./NoteRow` → components/settings/NoteRow.tsx (relative)
- `./useKnowledgeNotes` → components/settings/useKnowledgeNotes.ts (relative)

### components/settings/LanguageSelector.tsx
- `@/components/ui/dropdown-menu-sub` → components/ui/dropdown-menu-sub.tsx (via @/)
- `@/i18n` → i18n/index.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/settings/NotificationsSection.tsx
_(no internal imports — just react)_

### components/settings/ProviderCard.tsx
- `@/lib/animations` → lib/animations.ts (via @/)
- `@/lib/provider-logos` → lib/provider-logos.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)

### components/settings/ProviderForm.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `@/components/ui/label` → components/ui/label.tsx (via @/)

### components/settings/ProviderFormSelector.tsx
- _(imports many provider form files from ./providers/ — see full grep output)_
- `./providers/ZaiProviderForm` → components/settings/providers/ZaiProviderForm.tsx (relative)

### components/settings/ProviderGrid.tsx
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./ProviderCard` → components/settings/ProviderCard.tsx (relative)

### components/settings/ProviderSettingsPanel.tsx
- `@/lib/animations` → lib/animations.ts (via @/)
- `./ProviderFormSelector` → components/settings/ProviderFormSelector.tsx (relative)

### components/settings/SandboxModeSelector.tsx
_(no internal imports)_

### components/settings/SandboxPanel.tsx
- `./SandboxModeSelector` → components/settings/SandboxModeSelector.tsx (relative)
- `./useSandboxPanel` → components/settings/useSandboxPanel.ts (relative)

### components/settings/SandboxSection.tsx
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/settings/SpeechSettingsForm.tsx
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `../../lib/myboteam` → lib/myboteam.ts (relative)
- `../../lib/platform` → lib/platform.ts (relative)

### components/settings/ThemeSelector.tsx
- `@/components/ui/dropdown-menu-sub` → components/ui/dropdown-menu-sub.tsx (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/lib/theme` → lib/theme.ts (via @/)
- `@/lib/theme-core` → lib/theme-core.ts (via @/)
- `@/lib/utils` → lib/utils.ts (via @/)
- `../ui/ThemeColorSelector` → components/ui/ThemeColorSelector.tsx (relative)

### components/settings/useKnowledgeNotes.ts
- `@/lib/myboteam` → lib/myboteam.ts (via @/, type-only)

### components/settings/useSandboxPanel.ts
- `@/lib/logger` → lib/logger.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/settings/WorkspacePanelForm.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `./ColorPicker` → components/settings/ColorPicker.tsx (relative)

### components/settings/WorkspaceRow.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `./KnowledgeNotesPanel` → components/settings/KnowledgeNotesPanel.tsx (relative)
- `./EditWorkspaceForm` re-exported from `./WorkspacePanelForm` (same file as CreateWorkspaceForm)

### components/settings/WorkspacesPanel.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/stores/workspaceStore` → stores/workspaceStore.ts (via @/)
- `./WorkspacePanelForm` → components/settings/WorkspacePanelForm.tsx (relative)
- `./WorkspaceRow` → components/settings/WorkspaceRow.tsx (relative)

### components/settings/integrations/index.ts
_(re-exports)_

### components/settings/integrations/IntegrationsPanel.tsx
- `@/components/settings/connectors/ConnectorAddForm` → components/settings/connectors/ConnectorAddForm.tsx (via @/)
- `@/components/settings/connectors/ConnectorList` → components/settings/connectors/ConnectorList.tsx (via @/)
- `@/components/settings/connectors/SlackConnectorSection` → components/settings/connectors/SlackConnectorSection.tsx (via @/)
- `@/components/settings/connectors/useConnectorsPanel` → components/settings/connectors/useConnectorsPanel.ts (via @/)
- `@/components/ui/tabs` → components/ui/tabs.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `./ConnectorCardsSection` → components/settings/integrations/ConnectorCardsSection.tsx (relative)
- `./WhatsAppCard` → components/settings/integrations/WhatsAppCard.tsx (relative)

### components/settings/integrations/ConnectorCardsSection.tsx
- `@/components/settings/connectors/DatadogConnectorCard` → components/settings/connectors/DatadogConnectorCard.tsx (via @/)
- `@/components/settings/connectors/LightdashConnectorCard` → components/settings/connectors/LightdashConnectorCard.tsx (via @/)
- `@/components/settings/connectors/OAuthConnectorCard` → components/settings/connectors/OAuthConnectorCard.tsx (via @/)
- `../google-accounts/GoogleAccountsSection` → components/settings/google-accounts/GoogleAccountsSection.tsx (relative)
- `./integrations-helpers` → components/settings/integrations/integrations-helpers.ts (relative)

### components/settings/integrations/WhatsAppCard.tsx
- `./QRCodeDisplay` → components/settings/integrations/QRCodeDisplay.tsx (relative)
- `./useWhatsAppCard` → components/settings/integrations/useWhatsAppCard.ts (relative)

### components/settings/integrations/useWhatsAppCard.ts
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `./useWhatsAppSubscriptions` → components/settings/integrations/useWhatsAppSubscriptions.ts (relative)

### components/settings/integrations/useWhatsAppSubscriptions.ts
- `./useWhatsAppCard` → components/settings/integrations/useWhatsAppCard.ts (relative, type-only)

### components/settings/integrations/QRCodeDisplay.tsx
_(no internal imports)_

### components/settings/integrations/integrations-helpers.ts
_(no internal imports)_

### components/settings/google-accounts/GoogleAccountCard.tsx
- `@/components/ui/avatar` → components/ui/avatar.tsx (via @/)
- `@/components/ui/badge` → components/ui/badge.tsx (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)

### components/settings/google-accounts/GoogleAccountsSection.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/stores/googleAccountStore` → stores/googleAccountStore.ts (via @/)
- `./GoogleAccountCard` → components/settings/google-accounts/GoogleAccountCard.tsx (relative)
- `./GoogleLabelDialog` → components/settings/google-accounts/GoogleLabelDialog.tsx (relative)
- `./useGoogleAuth` → components/settings/google-accounts/useGoogleAuth.ts (relative)

### components/settings/google-accounts/GoogleLabelDialog.tsx
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `./GoogleLabelDialogInner` → components/settings/google-accounts/GoogleLabelDialogInner.tsx (relative)

### components/settings/google-accounts/GoogleLabelDialogInner.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `@/components/ui/input` → components/ui/input.tsx (via @/)

### components/settings/google-accounts/useGoogleAuth.ts
- `@/stores/googleAccountStore` → stores/googleAccountStore.ts (via @/)

### components/settings/connectors/ConnectorAddForm.tsx
_(re-read needed)_

### components/settings/connectors/ConnectorCard.tsx
_(re-read needed)_

### components/settings/connectors/ConnectorList.tsx
_(re-read needed)_

### components/settings/connectors/DatadogConnectorCard.tsx
_(reads ./datadog/*)_

### components/settings/connectors/LightdashConnectorCard.tsx
_(reads ./lightdash/*)_

### components/settings/connectors/OAuthConnectorCard.tsx
_(reads ./oauth-status)_

### components/settings/connectors/SlackConnectorSection.tsx
_(re-read needed)_

### components/settings/connectors/useConnectors.ts
_(re-read needed)_

### components/settings/connectors/useConnectors.types.ts
_(re-read needed)_

### components/settings/connectors/useConnectorsPanel.ts
_(re-read needed)_

### components/settings/connectors/useOAuthCallback.ts
_(re-read needed)_

### components/settings/connectors/index.ts
_(re-exports)_

### components/settings/providers/index.ts
_(re-exports)_

### components/settings/providers/ → Many provider files
_(all share pattern of importing from ../shared/ and @/lib/* — see full grep output above)_

### components/settings/scheduler/index.ts
_(re-exports)_

### components/settings/scheduler/AddScheduleDialog.tsx
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)

### components/settings/scheduler/ScheduleCard.tsx
- `@/components/ui/switch` → components/ui/switch.tsx (via @/)

### components/settings/scheduler/SchedulerPanel.tsx
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/stores/workspaceStore` → stores/workspaceStore.ts (via @/)
- `./AddScheduleDialog` → components/settings/scheduler/AddScheduleDialog.tsx (relative)
- `./ScheduleCard` → components/settings/scheduler/ScheduleCard.tsx (relative)

### components/settings/shared/index.ts
_(re-exports)_

### components/settings/shared/AlertCallout.tsx
- `@/components/ui/alert` → components/ui/alert.tsx (via @/)

### components/settings/shared/ApiKeyInput.tsx
_(no internal imports)_

### components/settings/shared/ConnectButton.tsx
_(no internal imports)_

### components/settings/shared/ConnectedControls.tsx
_(no internal imports)_

### components/settings/shared/ConnectionStatus.tsx
_(no internal imports)_

### components/settings/shared/FormError.tsx
- `@/lib/animations` → lib/animations.ts (via @/)

### components/settings/shared/ModelSelector.tsx
- `@/components/ui/searchable-select` → components/ui/searchable-select.tsx (via @/)

### components/settings/shared/ProviderFormHeader.tsx
- `@/lib/utils` → lib/utils.ts (via @/)

### components/settings/shared/RegionSelector.tsx
- `@/components/ui/searchable-select` → components/ui/searchable-select.tsx (via @/)

### components/settings/shared/ToolSupportBadge.tsx
_(no internal imports)_

### components/settings/skills/index.ts
_(re-exports)_

### components/settings/skills/AddSkillDropdown.tsx
- `@/components/skills/CreateSkillModal` → components/skills/CreateSkillModal.tsx (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `./UploadErrorDialog` → components/settings/skills/UploadErrorDialog.tsx (relative)
- `./useAddSkill` → components/settings/skills/useAddSkill.ts (relative)

### components/settings/skills/SkillCard.tsx
_(imports from phosphor)_

### components/settings/skills/SkillsFilterBar.tsx
- `./useSkillsPanel` → components/settings/skills/useSkillsPanel.ts (relative, type-only)

### components/settings/skills/skillsFiltering.ts
_(no internal imports)_

### components/settings/skills/SkillsPanel.tsx
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `@/lib/animations` → lib/animations.ts (via @/)
- `./SkillCard` → components/settings/skills/SkillCard.tsx (relative)
- `./SkillsFilterBar` → components/settings/skills/SkillsFilterBar.tsx (relative)
- `./useSkillsPanel` → components/settings/skills/useSkillsPanel.ts (relative)

### components/settings/skills/UploadErrorDialog.tsx
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)

### components/settings/skills/useAddSkill.ts
- `@/lib/logger` → lib/logger.ts (via @/)

### components/settings/skills/useSkillsPanel.ts
- `@/lib/logger` → lib/logger.ts (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)

### components/skills/index.ts
_(re-exports)_

### components/skills/CreateSkillModal.tsx
- `@/components/skills/createSkillPrompt` → components/skills/createSkillPrompt.ts (via @/)
- `@/components/ui/button` → components/ui/button.tsx (via @/)
- `@/components/ui/dialog` → components/ui/dialog.tsx (via @/)
- `@/components/ui/input` → components/ui/input.tsx (via @/)
- `@/lib/myboteam` → lib/myboteam.ts (via @/)
- `@/stores/taskStore` → stores/taskStore.ts (via @/)

### components/skills/createSkillPrompt.ts
_(no internal imports)_

---
