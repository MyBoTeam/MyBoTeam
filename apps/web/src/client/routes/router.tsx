import { type ComponentType, lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router';
import { RouteErrorFallback } from '../components/RouteErrorFallback';
import { App } from '../layouts/main/App';

const HomePage = lazy(() => import('../pages/home/Home').then(namedDefault('HomePage')));
const ConversationsPage = lazy(() =>
  import('../pages/conversations/ConversationsPage').then((module) => ({
    default: module.default,
  })),
);
const ConversationsFavoritesPage = lazy(() =>
  import('../pages/conversations/ConversationsFavoritesPage').then((module) => ({
    default: module.default,
  })),
);
const ExamplesPage = lazy(() =>
  import('../pages/conversations/ExamplesPage').then((module) => ({ default: module.default })),
);
const ExecutionPage = lazy(() =>
  import('../pages/conversation/ExecutionPage').then((module) => ({ default: module.default })),
);
const SettingsLayout = lazy(() =>
  import('../layouts/settings/SettingsLayout').then((module) => ({ default: module.default })),
);
const GeneralPage = lazy(() =>
  import('../pages/settings/general/GeneralPage').then(namedDefault('GeneralPage')),
);
const ProvidersPage = lazy(() =>
  import('../pages/settings/providers/ProvidersPage').then(namedDefault('ProvidersPage')),
);
const AboutPage = lazy(() =>
  import('../pages/settings/about/AboutPage').then(namedDefault('AboutPage')),
);
const SkillsPage = lazy(() =>
  import('../pages/settings/skills/SkillsPage').then(namedDefault('SkillsPage')),
);
const BrowsersPage = lazy(() =>
  import('../pages/settings/browsers/BrowsersPage').then(namedDefault('BrowsersPage')),
);
const WorkspacesPage = lazy(() =>
  import('../pages/settings/workspaces/WorkspacesPage').then(namedDefault('WorkspacesPage')),
);
const IntegrationsPage = lazy(() =>
  import('../pages/settings/integrations/IntegrationsPage').then(namedDefault('IntegrationsPage')),
);
const SchedulerPage = lazy(() =>
  import('../pages/settings/scheduler/SchedulerPage').then(namedDefault('SchedulerPage')),
);
const VoicePage = lazy(() =>
  import('../pages/settings/voice/VoicePage').then(namedDefault('VoicePage')),
);

function namedDefault<TModule, TName extends keyof TModule>(name: TName) {
  return (module: TModule) => ({ default: module[name] as ComponentType });
}

function pageElement(Page: ComponentType) {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    errorElement: <RouteErrorFallback />,
    children: [
      {
        Component: App,
        children: [
          { index: true, element: pageElement(HomePage), errorElement: <RouteErrorFallback /> },
          {
            path: 'conversations',
            element: pageElement(ConversationsPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'conversations/favorites',
            element: pageElement(ConversationsFavoritesPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'examples',
            element: pageElement(ExamplesPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'execution/:id',
            element: pageElement(ExecutionPage),
            errorElement: <RouteErrorFallback />,
          },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
      {
        path: 'settings',
        element: pageElement(SettingsLayout),
        errorElement: <RouteErrorFallback />,
        children: [
          { index: true, element: <Navigate to="general" replace /> },
          {
            path: 'general',
            element: pageElement(GeneralPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'providers',
            element: pageElement(ProvidersPage),
            errorElement: <RouteErrorFallback />,
          },
          { path: 'about', element: pageElement(AboutPage), errorElement: <RouteErrorFallback /> },
          {
            path: 'skills',
            element: pageElement(SkillsPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'browsers',
            element: pageElement(BrowsersPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'workspaces',
            element: pageElement(WorkspacesPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'integrations',
            element: pageElement(IntegrationsPage),
            errorElement: <RouteErrorFallback />,
          },
          {
            path: 'scheduler',
            element: pageElement(SchedulerPage),
            errorElement: <RouteErrorFallback />,
          },
          { path: 'voice', element: pageElement(VoicePage), errorElement: <RouteErrorFallback /> },
        ],
      },
    ],
  },
]);
