# Page-Based & Tiered Shared Components Architecture Refactor

## Objective

Restructure `apps/web/src/client/` from its current layout into a Page-Based and Tiered Shared Components Architecture. No functional changes — only file moves and import path rewrites.

## Target Structure

```
src/client/
├── main.tsx                        # Entry point (unchanged)
├── styles/
│   └── globals.css                 # Tailwind CSS v4 setup (unchanged)
├── vite-env.d.ts                   # TypeScript env types
│
├── layouts/
│   ├── main/
│   │   ├── components/             # Sidebar, Header, NavItem, NavLink, WorkspaceSelector,
│   │   │                           # ConversationListItem, SidebarFallback, SettingsDialog/DialogContent,
│   │   │                           # settings-tabs.ts
│   │   ├── hooks/                  # useSettingsDialog.ts + types + effects
│   │   ├── App.tsx                 # Root layout wrapper
│   │   ├── App.components.tsx      # AnimatedOutletWrapper
│   │   └── App.types.ts            # AppStatus type
│   └── settings/
│       ├── components/             # SettingsLayout sub-components
│       ├── hooks/
│       └── SettingsLayout.tsx      # Settings layout wrapper
│
├── components/
│   ├── ui/                         # shadcn/ui primitives + custom atomic UI
│   │   ├── glass/                  # Glass variant shadcn components
│   │   ├── alert.tsx, avatar.tsx, badge.tsx, button.tsx, card.tsx
│   │   ├── CodeBlock.tsx, dialog.tsx, dropdown-menu*.tsx
│   │   ├── ErrorBoundary.tsx, input.tsx, label.tsx
│   │   ├── ModelIndicator.tsx, ModelIndicator.types.ts
│   │   ├── ProviderIcon.tsx, ProviderSubMenu.tsx
│   │   ├── RouteErrorFallback.tsx
│   │   ├── scroll-area.tsx, searchable-select*.tsx, separator.tsx
│   │   ├── skeleton.tsx, SpeechInputButton.tsx, speech-input-button-types.ts
│   │   ├── speechInputHelpers.tsx, StarButton.tsx, streaming-text.tsx
│   │   ├── switch.tsx, tabs.tsx, textarea.tsx
│   │   ├── ThemeColorSelector.tsx, ThemeToggle.tsx, tooltip.tsx
│   │   └── ...
│   ├── common/                     # Global reusable components
│   │   ├── ActionChip.tsx, Arrow.tsx
│   │   ├── AuthErrorToast.tsx, CloseConfirmDialog.tsx
│   │   ├── DaemonConnectionToast.tsx, DaemonStatusDot.tsx
│   │   ├── SpinningIcon.tsx, StatusIcon.tsx
│   │   ├── TodoListItem.tsx, TodoSidebar.tsx
│   │   ├── TaskLauncher/ (index.ts, TaskLauncher.tsx, TaskLauncherContent.tsx, TaskLauncherItem.tsx)
│   │   ├── BrowserScriptCard.tsx, BrowserScriptCardHelpers.tsx, BrowserScriptUtils.ts
│   │   └── robot/ (FloatingRobot.tsx, FloatingRobot.css)
│   └── forms/                      # Shared form fields/validators (initially empty/minimal)
│
├── pages/
│   ├── home/                       # Landing/home page
│   │   ├── components/             # TaskInputBar, TaskInputTextarea, TaskInputToolbar,
│   │   │                           # TaskInputAttachmentList, SlashCommandPopover,
│   │   │                           # FileTypeIcon, IntegrationIcons, PlusMenu/
│   │   ├── hooks/                  # useTaskInputBar, useHomePage, usePromptAttachments
│   │   ├── Home.tsx                # Main page view
│   │   ├── ExamplesSection.tsx, FavoritesSection.tsx
│   │   └── homeConstants.ts
│   │
│   ├── conversation/               # Single conversation/task execution view (renamed from execution/)
│   │   ├── components/             # BrowserPreview, CreditExhaustedChatBanner,
│   │   │                           # DebugLogList, DebugPanel, DebugPanelHeader,
│   │   │                           # MessageList, MessageCopyButton, MessageTaskAction,
│   │   │                           # PermissionDialog/File/Question/Tool
│   │   │                           # PreviewBody, StatusBadge, ToolProgress,
│   │   │                           # SpinningIcon (from components/execution/)
│   │   │                           # permission-utils.ts, browserPreviewState.ts,
│   │   │                           # message-markdown-config.tsx
│   │   ├── hooks/                  # useBrowserPreview, useBrowserPreviewIpc,
│   │   │                           # useExecutionActions, useExecutionCore,
│   │   │                           # useExecutionPage, useExecutionEffects, etc.
│   │   ├── ConversationView.tsx    # Main page view (renamed from Execution.tsx)
│   │   ├── ConversationHeader.tsx  # (renamed from ExecutionHeader.tsx)
│   │   ├── ConversationCompleteFooter.tsx # (renamed from ExecutionCompleteFooter.tsx)
│   │   ├── FollowUpAttachments.tsx, FollowUpInput.tsx, FollowUpToolbar.tsx
│   │   ├── QueuedEmptyState.tsx, QueuedState.tsx
│   │   ├── AnimatedOutlet.tsx, DragOverlay.tsx
│   │   ├── conversation-utils.ts, conversationStatusUtils.ts
│   │   └── types.ts
│   │
│   ├── conversations/              # Task/conversations list (renamed from history/)
│   │   ├── components/             # ConversationList (from TaskHistory.tsx),
│   │   │                           # ConversationListItem (from TaskHistoryItem.tsx)
│   │   ├── ConversationsPage.tsx
│   │   ├── ConversationsFavoritesPage.tsx
│   │   └── ExamplesPage.tsx
│   │
│   └── settings/
│       ├── general/                # GeneralPage.tsx + LanguageSelector, ThemeSelector, etc.
│       ├── providers/              # ProvidersPage.tsx + providers/* (vertex/ preserved)
│       ├── integrations/           # IntegrationsPage.tsx + WhatsApp, QR, panels
│       ├── connectors/             # Connectors page + Datadog/Lightdash/Slack cards
│       ├── google-accounts/        # Google account management
│       ├── scheduler/              # Scheduler page + panels
│       ├── skills/                 # SkillsPage + CreateSkillModal
│       ├── about/                  # AboutPage
│       ├── browsers/               # BrowsersPage
│       ├── voice/                  # VoicePage
│       └── workspaces/             # WorkspacesPage + forms
│
├── routes/                         # React Router v7 config
│   └── router.tsx                  # (from router.tsx)
│
├── stores/                         # Zustand stores (unchanged)
│   ├── taskStore.ts, daemonStore.ts, sidebarStore.ts
│   ├── workspaceStore.ts, googleAccountStore.ts
│   └── task-*.ts (execution/lifecycle/permission/update actions)
│
├── hooks/                          # Global application hooks
│   ├── useTheme.ts, useSettings.ts
│   ├── useSpeechInput*.ts, useSpeechRecorder.ts
│   ├── useSlashCommand*.ts, useTypingPlaceholder.ts
│   ├── useTaskInputBehavior.ts, useTaskInputDragDrop.ts
│   ├── useCreditsState.ts
│   └── speech-types.ts
│
├── config/                         # Network clients, i18n setup, platform detection
│   ├── i18n/ (index.ts + locales/)
│   ├── myboteam.ts, myboteam-tasks.ts, myboteam-accounts.ts
│   ├── myboteam-analytics.ts, myboteam-connectors.ts
│   ├── myboteam-providers.ts, myboteam-settings.ts, myboteam-types.ts
│   └── platform.ts
│
└── utils/                          # Pure utility functions
    ├── utils.ts, fileUtils.ts, logger.ts
    ├── animations.ts, hover-effects.ts, glass-utils.ts
    ├── theme.ts, theme-color.ts, theme-core.ts
    ├── model-utils.ts, task-utils.ts, provider-logos.ts
    ├── waiting-detection.ts
    ├── attachments.tsx
    └── tool-mappings.ts
```

## File Renames

| Current | → New |
|---------|-------|
| `pages/Execution.tsx` | `pages/conversation/ConversationView.tsx` |
| `pages/execution/ExecutionHeader.tsx` | `pages/conversation/ConversationHeader.tsx` |
| `pages/execution/ExecutionCompleteFooter.tsx` | `pages/conversation/ConversationCompleteFooter.tsx` |
| `pages/execution/execution-utils.ts` | `pages/conversation/conversation-utils.ts` |
| `pages/execution/executionStatusUtils.ts` | `pages/conversation/conversationStatusUtils.ts` |
| `pages/History.tsx` | removed (merged into `pages/conversations/`) |
| `components/history/TaskHistory.tsx` | `pages/conversations/components/ConversationList.tsx` |
| `components/history/TaskHistoryItem.tsx` | `pages/conversations/components/ConversationListItem.tsx` |
| `components/execution/SpinningIcon.tsx` | removed (duplicate — use `components/common/SpinningIcon.tsx`) |

## Rules

1. No functional changes — zero application logic, state flows, styling, hooks behavior, or component code changed.
2. All relative imports (`../../`) and `@/` alias imports rewritten to match new locations.
3. The `@` Vite alias stays mapped to `src/client/`, so `@/components/ui/button` remains valid.
4. File names renamed per the table above; inner references updated.
5. Vite config (`vite.config.ts`) unchanged.
6. `pnpm check` and `pnpm -F @myboteam/web typecheck` must pass after migration.
