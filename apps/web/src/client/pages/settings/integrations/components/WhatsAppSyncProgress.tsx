import { Button } from '@/components/ui/button';

interface WhatsAppSyncProgressProps {
  syncState: 'idle' | 'syncing' | 'complete';
  syncProgress: { chatsProcessed: number; messagesProcessed: number };
  onResync: () => void;
}

export function WhatsAppSyncProgress({
  syncState,
  syncProgress,
  onResync,
}: WhatsAppSyncProgressProps) {
  if (syncState === 'idle') return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{syncState === 'syncing' ? 'Syncing messages...' : 'Sync complete'}</span>
        <span>
          {syncProgress.chatsProcessed} chats, {syncProgress.messagesProcessed} messages
        </span>
      </div>
      {syncState === 'syncing' && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all animate-pulse"
            style={{ width: '100%' }}
          />
        </div>
      )}
      {syncState === 'complete' && (
        <Button variant="outline" size="sm" onClick={onResync} className="mt-1">
          Resync
        </Button>
      )}
    </div>
  );
}
