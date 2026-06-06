import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ExamplesSection } from './home/ExamplesSection';
import { USE_CASE_KEYS } from './home/homeConstants';

export default function ExamplesPage() {
  const { t } = useTranslation('home');
  const navigate = useNavigate();

  const useCaseExamples = useMemo(
    () =>
      USE_CASE_KEYS.map(({ key, icons }) => ({
        key,
        title: t(`useCases.${key}.title`),
        description: t(`useCases.${key}.description`),
        prompt: t(`useCases.${key}.prompt`),
        icons,
      })),
    [t],
  );

  const handleExampleClick = (prompt: string) => {
    navigate('/', { state: { prompt } });
  };

  return (
    <div className="h-full flex flex-col items-center px-6">
      <ExamplesSection useCaseExamples={useCaseExamples} onExampleClick={handleExampleClick} />
    </div>
  );
}
