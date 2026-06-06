import { createHashRouter, Navigate } from 'react-router';
import { App } from './App';
import SettingsLayout from './components/layout/SettingsLayout';
import { RouteErrorFallback } from './components/ui/RouteErrorFallback';
import ConversationsFavoritesPage from './pages/ConversationsFavoritesPage';
import ConversationsPage from './pages/ConversationsPage';
import ExamplesPage from './pages/ExamplesPage';
import ExecutionPage from './pages/Execution';
import { HomePage } from './pages/Home';
import { AboutPage } from './pages/settings/AboutPage';
import { BrowsersPage } from './pages/settings/BrowsersPage';
import { GeneralPage } from './pages/settings/GeneralPage';
import { IntegrationsPage } from './pages/settings/IntegrationsPage';
import { ProvidersPage } from './pages/settings/ProvidersPage';
import { SchedulerPage } from './pages/settings/SchedulerPage';
import { SkillsPage } from './pages/settings/SkillsPage';
import { VoicePage } from './pages/settings/VoicePage';
import { WorkspacesPage } from './pages/settings/WorkspacesPage';

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
            Component: ExecutionPage,
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
