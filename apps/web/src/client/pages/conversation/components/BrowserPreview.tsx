import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Globe } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/utils/utils';
import { springs } from '@/utils/animations';
import { PreviewBody } from './PreviewBody';
import { StatusBadge } from './StatusBadge';
import { useBrowserPreview } from './useBrowserPreview';

interface BrowserPreviewProps {
  taskId: string;

  pageName?: string | null;

  currentTool?: string | null;
  className?: string;
}

export const BrowserPreview = memo(function BrowserPreview({
  taskId,
  pageName,
  currentTool,
  className,
}: BrowserPreviewProps) {
  const contentId = `browser-preview-content-${taskId}`;
  const { frameData, currentUrl, status, error, isCollapsed, setIsCollapsed, imgRef } =
    useBrowserPreview({ taskId, pageName, currentTool });

  if (status === 'idle' && !frameData) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className={cn(
        'bg-card/70 border border-border rounded-2xl overflow-hidden max-w-[90%] mt-2',
        className,
      )}
    >
      {}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/50">
        <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
          {currentUrl || 'Browser Preview'}
        </span>
        <StatusBadge status={status} />
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-muted-foreground hover:text-foreground transition-colors ml-1"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          aria-expanded={!isCollapsed}
          aria-controls={contentId}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {}
      <div id={contentId}>
        <PreviewBody
          status={status}
          frameData={frameData}
          imgRef={imgRef}
          error={error}
          isCollapsed={isCollapsed}
        />
      </div>
    </motion.div>
  );
});
