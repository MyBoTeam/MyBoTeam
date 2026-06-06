import type { ProviderId } from '@myboteam/agent-core/common';
import { MemoryRouter } from 'react-router';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ProvidersPage } from '@/pages/settings/ProvidersPage';

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
          <ProvidersPage onApiKeySaved={onApiKeySaved} />
        </MemoryRouter>
      </DialogContent>
    </Dialog>
  );
}
