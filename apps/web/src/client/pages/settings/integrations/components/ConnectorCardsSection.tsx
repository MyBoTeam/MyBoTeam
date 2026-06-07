import type { ConnectorAuthStatus } from '@myboteam/agent-core/common';
import { OAuthProviderId } from '@myboteam/agent-core/common';
import { useTranslation } from 'react-i18next';
import githubIcon from '/assets/icons/integrations/github.svg';
import jiraIcon from '/assets/icons/integrations/jira.svg';
import mondayIcon from '/assets/icons/integrations/monday.svg';
import notionIcon from '/assets/icons/integrations/notion.svg';
import { DatadogConnectorCard } from '../../connectors/components/DatadogConnectorCard';
import { LightdashConnectorCard } from '../../connectors/components/LightdashConnectorCard';
import { OAuthConnectorCard } from '../../connectors/components/OAuthConnectorCard';
import { GoogleAccountsSection } from '../../google-accounts/components/GoogleAccountsSection';
import { getAuthState, isActionLoading } from './integrations-helpers';

interface ConnectorCardsSectionProps {
  builtInAuthStates: Record<string, ConnectorAuthStatus>;
  builtInActionLoading: Record<string, boolean>;
  onAuthenticate: (providerId: OAuthProviderId) => void;
  onDisconnect: (providerId: OAuthProviderId) => void;
  refetch: () => Promise<void>;
}

export function ConnectorCardsSection({
  builtInAuthStates,
  builtInActionLoading,
  onAuthenticate,
  onDisconnect,
  refetch,
}: ConnectorCardsSectionProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-col gap-3">
      <GoogleAccountsSection />

      <OAuthConnectorCard
        iconSrc={jiraIcon}
        displayName={t('connectors.jira.title')}
        authState={getAuthState(builtInAuthStates, OAuthProviderId.Jira)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.Jira)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.Jira)}
        onDisconnect={() => onDisconnect(OAuthProviderId.Jira)}
        testId="jira-auth-card"
      />

      <OAuthConnectorCard
        iconSrc={githubIcon}
        displayName={t('connectors.github.title')}
        authState={getAuthState(builtInAuthStates, OAuthProviderId.GitHub)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.GitHub)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.GitHub)}
        onDisconnect={() => onDisconnect(OAuthProviderId.GitHub)}
        testId="github-auth-card"
      />

      <OAuthConnectorCard
        iconSrc={notionIcon}
        displayName={t('connectors.notion.title')}
        authState={getAuthState(builtInAuthStates, OAuthProviderId.Notion)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.Notion)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.Notion)}
        onDisconnect={() => onDisconnect(OAuthProviderId.Notion)}
        testId="notion-auth-card"
      />

      <OAuthConnectorCard
        iconSrc={mondayIcon}
        displayName={t('connectors.monday.title')}
        authState={getAuthState(builtInAuthStates, OAuthProviderId.Monday)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.Monday)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.Monday)}
        onDisconnect={() => onDisconnect(OAuthProviderId.Monday)}
        marketplaceUrl="https://monday.com/marketplace"
        testId="monday-auth-card"
      />

      <DatadogConnectorCard
        authState={getAuthState(builtInAuthStates, OAuthProviderId.Datadog)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.Datadog)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.Datadog)}
        onDisconnect={() => onDisconnect(OAuthProviderId.Datadog)}
        refetch={refetch}
      />

      <LightdashConnectorCard
        authState={getAuthState(builtInAuthStates, OAuthProviderId.Lightdash)}
        actionLoading={isActionLoading(builtInActionLoading, OAuthProviderId.Lightdash)}
        onAuthenticate={() => onAuthenticate(OAuthProviderId.Lightdash)}
        onDisconnect={() => onDisconnect(OAuthProviderId.Lightdash)}
        refetch={refetch}
      />
    </div>
  );
}
