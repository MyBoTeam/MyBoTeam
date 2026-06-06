import { IntegrationsPanel } from '@/components/settings/integrations';

export function IntegrationsPage() {
  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3">
        <h3 className="text-sm font-semibold text-foreground">Integrations</h3>
      </div>
      <IntegrationsPanel />
    </div>
  );
}
