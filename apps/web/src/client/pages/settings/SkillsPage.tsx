import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AddSkillDropdown, SkillsPanel } from '@/components/settings/skills';

export function SkillsPage() {
  const { t } = useTranslation('settings');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{t('tabs.skills')}</h3>
        <AddSkillDropdown onSkillAdded={() => setRefreshTrigger((p) => p + 1)} onClose={() => {}} />
      </div>
      <SkillsPanel refreshTrigger={refreshTrigger} />
    </div>
  );
}
