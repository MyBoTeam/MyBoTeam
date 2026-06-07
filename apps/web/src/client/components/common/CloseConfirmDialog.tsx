import { ArrowRight, Power, Warning } from '@phosphor-icons/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMyBoTeam } from '@/config/myboteam';

type CloseDecision = 'keep-daemon' | 'stop-daemon';

export function CloseConfirmDialog() {
  const myboteam = useMyBoTeam();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<CloseDecision>('keep-daemon');

  useEffect(() => {
    if (!myboteam.onCloseRequested) {
      return;
    }
    const unsubscribe = myboteam.onCloseRequested(() => {
      setDecision('keep-daemon');
      setOpen(true);
    });
    return unsubscribe;
  }, [myboteam]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    myboteam.respondToClose?.(decision);
  }, [myboteam, decision]);

  const handleCancel = useCallback(() => {
    setOpen(false);
    myboteam.respondToClose?.('cancel');
  }, [myboteam]);

  const isKeepDaemon = decision === 'keep-daemon';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          handleCancel();
        }
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Power className="h-5 w-5" weight="bold" />
            Close MyBoTeam
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Choose how to close the application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {}
          <button
            type="button"
            onClick={() => setDecision('keep-daemon')}
            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
              isKeepDaemon
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card/70 hover:bg-muted/50'
            }`}
          >
            <div
              className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                isKeepDaemon ? 'border-primary' : 'border-muted-foreground/40'
              }`}
            >
              {isKeepDaemon && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">Close window</div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                The background daemon keeps running. Scheduled tasks, WhatsApp messages, and other
                integrations will continue working.
              </p>
            </div>
          </button>

          {}
          <button
            type="button"
            onClick={() => setDecision('stop-daemon')}
            className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
              !isKeepDaemon
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border bg-card/70 hover:bg-muted/50'
            }`}
          >
            <div
              className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                !isKeepDaemon ? 'border-destructive' : 'border-muted-foreground/40'
              }`}
            >
              {!isKeepDaemon && <div className="h-2 w-2 rounded-full bg-destructive" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">Close & stop daemon</div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Stop all background processing. Scheduled tasks and integrations will not run until
                you reopen the app.
              </p>
            </div>
          </button>

          {}
          {!isKeepDaemon && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3">
              <Warning className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" weight="bold" />
              <p className="text-xs text-destructive leading-relaxed">
                Background tasks, scheduled jobs, and WhatsApp message processing will stop
                immediately. They will resume when you reopen MyBoTeam.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant={isKeepDaemon ? 'default' : 'destructive'}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            {isKeepDaemon ? 'Close' : 'Close & Stop'}
            <ArrowRight className="h-3.5 w-3.5" weight="bold" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
