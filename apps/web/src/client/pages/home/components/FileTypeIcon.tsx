import type { FileAttachmentInfo } from '@myboteam/agent-core/common';
import { Code, File, FilePdf, FileText, Image } from '@phosphor-icons/react';

interface FileTypeIconProps {
  type: FileAttachmentInfo['type'];
  className?: string;
}

export function FileTypeIcon({ type, className }: FileTypeIconProps) {
  switch (type) {
    case 'image':
      return <Image className={className} />;
    case 'text':
      return <FileText className={className} />;
    case 'code':
      return <Code className={className} />;
    case 'pdf':
      return <FilePdf className={className} />;
    default:
      return <File className={className} />;
  }
}
