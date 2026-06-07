import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getMyBoTeam, isRunningInElectron } from '@/config/myboteam';

export function AboutTab() {
  const { t } = useTranslation('settings');
  const [appVersion, setAppVersion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRunningInElectron()) {
      setLoading(false);
      return;
    }
    getMyBoTeam()
      .getVersion()
      .then((v) => {
        setAppVersion(v);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card/70 p-6">
        <div className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground">{t('about.visitUs')}</div>
            <a
              href="https://www.myboteam.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.myboteam.app
            </a>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('about.haveQuestion')}</div>
            <a href="mailto:support@myboteam.app" className="text-primary hover:underline">
              support@myboteam.app
            </a>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t('about.versionLabel')}</div>
            <div className="font-medium">{appVersion || t('about.loading')}</div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
          {t('about.allRightsReserved')}
        </div>
      </div>
    </div>
  );
}
