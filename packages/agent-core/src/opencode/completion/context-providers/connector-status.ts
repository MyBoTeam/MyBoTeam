export interface BuiltInConnectorStatus {
  displayName: string;
  connected: boolean;
}

export function formatBuiltInConnectorStatusSection(
  statuses: readonly BuiltInConnectorStatus[],
): string {
  if (statuses.length === 0) {
    return '';
  }

  const statusLine = statuses
    .map((s) => `${s.displayName}: ${s.connected ? 'connected' : 'not connected'}`)
    .join('. ');

  return `

<connected-integrations>
##############################################################################
# CONNECTED INTEGRATIONS
##############################################################################

${statusLine}.

Use @<name> to reference an integration (e.g. "@Jira", "@GitHub"). Only connected
integrations have active MCP tools available for this task.

##############################################################################
</connected-integrations>`;
}
