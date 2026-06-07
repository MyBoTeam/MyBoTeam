import type { FileAttachmentInfo } from '@myboteam/agent-core/common';
import { XCircle } from '@phosphor-icons/react';
import { getAttachmentIcon } from '@/utils/attachments';

export { DragOverlay } from './DragOverlay';

interface AttachmentListProps {
  attachments: FileAttachmentInfo[];
  removeAttachment: (id: string) => void;
}

export function AttachmentList({ attachments, removeAttachment }: AttachmentListProps) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="px-4 pt-4 pb-1 flex gap-2 overflow-x-auto items-center">
      {attachments.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-2 px-2.5 py-1.5 bg-muted/50 border border-border rounded-md shrink-0 max-w-[200px]"
          title={file.name}
        >
          {getAttachmentIcon(file.type)}
          <span className="text-xs font-medium truncate">{file.name}</span>
          <button
            onClick={() => removeAttachment(file.id)}
            aria-label={`Remove attachment ${file.name}`}
            className="text-muted-foreground hover:text-foreground shrink-0 ml-1 rounded-full p-0.5 hover:bg-muted"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
