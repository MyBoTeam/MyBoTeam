import { createHashRouter, Navigate } from 'react-router';
import { App } from './layouts/main/App';
import SettingsLayout from './layouts/settings/SettingsLayout';
import { RouteErrorFallback } from './components/ui/RouteErrorFallback';
import ConversationsFavoritesPage from './pages/conversations/ConversationsFavoritesPage';
import ConversationsPage from './pages/conversations/ConversationsPage';
import ExamplesPage from './pages/conversations/ExamplesPage';
import { ConversationView } from './pages/conversation/ConversationView';
import { HomePage } from './pages/home/Home';
import { AboutPage } from './pages/settings/about/AboutPage';
import { BrowsersPage } from './pages/settings/browsers/BrowsersPage';
import { GeneralPage } from './pages/settings/general/GeneralPage';
import { IntegrationsPage } from './pages/settings/integrations/IntegrationsPage';
import { ProvidersPage } from './pages/settings/providers/ProvidersPage';
import { SchedulerPage } from './pages/settings/scheduler/SchedulerPage';
import { SkillsPage } from './pages/settings/skills/SkillsPage';
import { VoicePage } from './pages/settings/voice/VoicePage';
import { WorkspacesPage } from './pages/settings/workspaces/WorkspacesPage';

export const router = createHashRouter([
  {
    path: '/',
    errorElement: <RouteErrorFallback />,
    children: [
      {
        Component: App,
        children: [
          { index: true, Component: HomePage, errorElement: <RouteErrorFallback /> },
          {
            path: 'conversations',
            Component: ConversationsPage,
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'conversations/favorites',
            Component: ConversationsFavoritesPage,
            errorElement: <RouteErrorFallback />,
          },
          { path: 'examples', Component: ExamplesPage, errorElement: <RouteErrorFallback /> },
          {
            path: 'execution/:id',
            Component: ConversationView,
            errorElement: <RouteErrorFallback />,
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
      {
        path: 'settings',
        Component: SettingsLayout,
        errorElement: <RouteErrorFallback />,
        children: [
          { index: true, element: <Navigate to="general" replace /> },
          { path: 'general', Component: GeneralPage, errorElement: <RouteErrorFallback /> },
          { path: 'providers', Component: ProvidersPage, errorElement: <RouteErrorFallback /> },
          { path: 'about', Component: AboutPage, errorElement: <RouteErrorFallback /> },
          { path: 'skills', Component: SkillsPage, errorElement: <RouteErrorFallback /> },
          { path: 'browsers', Component: BrowsersPage, errorElement: <RouteErrorFallback /> },
          { path: 'workspaces', Component: WorkspacesPage, errorElement: <RouteErrorFallback /> },
          {
            path: 'integrations',
            Component: IntegrationsPage,
            errorElement: <RouteErrorFallback />,
          },
          { path: 'scheduler', Component: SchedulerPage, errorElement: <RouteErrorFallback /> },
          { path: 'voice', Component: VoicePage, errorElement: <RouteErrorFallback /> },
        ],
      },
    ],
  },
]);
