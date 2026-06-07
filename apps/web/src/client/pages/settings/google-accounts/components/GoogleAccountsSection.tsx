import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { initGoogleAccountListener, useGoogleAccountStore } from '@/stores/googleAccountStore';
import { GoogleAccountCard } from './GoogleAccountCard';
import { GoogleLabelDialog } from './GoogleLabelDialog';
import { useGoogleAuth } from './useGoogleAuth';

export function GoogleAccountsSection() {
  const { accounts, loading, fetchAccounts, removeAccount, authError, clearAuthError } =
    useGoogleAccountStore();
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const { connecting, reconnectId, openAuth, cancelConnecting, setReconnectId } = useGoogleAuth();

  useEffect(() => {
    const cleanup = initGoogleAccountListener();
    fetchAccounts();
    return () => {
      cleanup();
    };
  }, [fetchAccounts]);

  const handleAddConfirm = async (label: string): Promise<void> => {
    setLabelDialogOpen(false);
    await openAuth(label);
  };

  const handleReconnect = async (id: string): Promise<void> => {
    const account = accounts.find((a) => a.googleAccountId === id);
    if (!account) {
      return;
    }
    setReconnectId(id);
    await openAuth(account.label, () => setReconnectId(null), id);
  };

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Google Accounts
      </h4>

      {authError && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <div className="flex-1">
            <p className="font-medium text-destructive">Google authentication failed</p>
            <p className="mt-1 text-muted-foreground">{authError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearAuthError}>
            Dismiss
          </Button>
        </div>
      )}

      {(() => {
        if (loading && accounts.length === 0) {
          return (
            <div className="flex h-[80px] items-center justify-center">
              <span className="text-sm text-muted-foreground">Loading accounts...</span>
            </div>
          );
        }

        if (accounts.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-8">
              <p className="text-sm text-muted-foreground">No Google accounts connected</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLabelDialogOpen(true)}
                disabled={connecting}
              >
                Add Google Account
              </Button>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2">
            {accounts.map((account) => (
              <GoogleAccountCard
                key={account.googleAccountId}
                account={account}
                onDisconnect={removeAccount}
                onReconnect={handleReconnect}
              />
            ))}
            <div className="mt-2 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLabelDialogOpen(true)}
                disabled={connecting || !!reconnectId}
              >
                Add Google Account
              </Button>
              {connecting && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Waiting for Google...</span>
                  <Button variant="ghost" size="sm" onClick={cancelConnecting}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {connecting && accounts.length === 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Waiting for Google...</span>
          <Button variant="ghost" size="sm" onClick={cancelConnecting}>
            Cancel
          </Button>
        </div>
      )}

      <GoogleLabelDialog
        open={labelDialogOpen}
        onConfirm={handleAddConfirm}
        onCancel={() => setLabelDialogOpen(false)}
      />
    </div>
  );
}
