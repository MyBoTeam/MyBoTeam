import { Button, DialogFooter, Input } from '@myboteam/ui';
import { useState } from 'react';

const MAX_LABEL_LENGTH = 20;

export function GoogleLabelDialogInner({
  onConfirm,
  onCancel,
}: {
  onConfirm: (label: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    const trimmed = label.trim();
    if (!trimmed) {
      setError('Label is required.');
      return;
    }
    if (trimmed.length > MAX_LABEL_LENGTH) {
      setError(`Label must be ${MAX_LABEL_LENGTH} characters or less.`);
      return;
    }
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <>
      <div className="space-y-3 py-1">
        <p className="text-sm text-muted-foreground">
          Give this Google account a label so you can tell it apart from others.
        </p>
        <Input
          value={label}
          onChange={(e) => {
            setLabel(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Work, Personal, School"
          maxLength={MAX_LABEL_LENGTH + 5}
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!label.trim()}>
          Connect
        </Button>
      </DialogFooter>
    </>
  );
}
