import type { ProviderId } from '@myboteam/agent-core/common';
import { lazy, Suspense } from 'react';
import { MemoryRouter } from 'react-router';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

const ProvidersPage = lazy(() =>
  import('@/pages/settings/providers/ProvidersPage').then((module) => ({
    default: module.ProvidersPage,
  })),
);

interface AuthSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
  initialProvider?: ProviderId;
  onApiKeySaved?: () => void;
}

export default function AuthSettingsDialog({
  open,
  onOpenChange,
  initialProvider,
  onApiKeySaved,
}: AuthSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogTitle className="sr-only">Authentication Settings</DialogTitle>
        <MemoryRouter initialEntries={[initialProvider ? `/?select=${initialProvider}` : '/']}>
          <Suspense fallback={null}>
            <ProvidersPage onApiKeySaved={onApiKeySaved} />
          </Suspense>
        </MemoryRouter>
      </DialogContent>
    </Dialog>
  );
}
