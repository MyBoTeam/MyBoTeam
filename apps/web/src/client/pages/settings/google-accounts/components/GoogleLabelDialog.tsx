import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleLabelDialogInner } from './GoogleLabelDialogInner';

interface GoogleLabelDialogProps {
  open: boolean;
  onConfirm: (label: string) => void;
  onCancel: () => void;
}

export function GoogleLabelDialog({ open, onConfirm, onCancel }: GoogleLabelDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Name this account</DialogTitle>
        </DialogHeader>
        {open && <GoogleLabelDialogInner onConfirm={onConfirm} onCancel={onCancel} />}
      </DialogContent>
    </Dialog>
  );
}
