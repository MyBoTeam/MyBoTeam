import { useTranslation } from 'react-i18next';

interface DragOverlayProps {
  setIsDragging: (v: boolean) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export function DragOverlay({ setIsDragging, handleDrop }: DragOverlayProps) {
  const { t } = useTranslation('execution');
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary"
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="text-primary font-medium flex items-center gap-2 pointer-events-none">
        {t('followUp.dropFilesToAttach')}
      </div>
    </div>
  );
}
