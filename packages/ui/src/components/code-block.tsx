import { Check, Copy } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const COPIED_TIMEOUT_MS = 1200;

function isDarkMode() {
  if (typeof document === 'undefined') {
    return false;
  }
  return document.documentElement.classList.contains('dark');
}

interface CodeBlockProps {
  language?: string;
  children: string;
  inline?: boolean;
}

export function CodeBlock({ language, children, inline = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isDark, setIsDark] = useState(isDarkMode);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, COPIED_TIMEOUT_MS);
    } catch {}
  }, [children]);

  if (inline) {
    return (
      <code className="bg-muted text-foreground px-1 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  }

  const displayLang = language || 'text';
  const prismTheme = isDark ? themes.oneDark : themes.oneLight;

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-border bg-muted">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/70">
        <span className="text-xs font-medium text-muted-foreground select-none">{displayLang}</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleCopy}
              data-testid="code-block-copy-button"
              aria-label="Copy code to clipboard"
              className={cn(
                'flex items-center gap-1 rounded px-2 py-0.5 text-xs transition-colors transition-opacity',
                'opacity-0 pointer-events-none',
                'group-hover/code:opacity-100 group-hover/code:pointer-events-auto',
                'group-focus-within/code:opacity-100 group-focus-within/code:pointer-events-auto',
                'focus-visible:opacity-100 focus-visible:pointer-events-auto',
                'text-muted-foreground hover:bg-accent hover:text-foreground',
                copied && '!text-green-600 dark:!text-green-400',
              )}
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Copy to clipboard</TooltipContent>
        </Tooltip>
      </div>

      <Highlight theme={prismTheme} code={children} language={displayLang}>
        {({ className: hlClassName, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={hlClassName}
            style={{
              ...style,
              margin: 0,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              fontSize: '0.8125rem',
              lineHeight: '1.6',
              overflowX: 'auto',
              fontFamily: 'ui-monospace, "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
            }}
          >
            {tokens.map((line, i) => {
              const lineProps = getLineProps({ line });
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: tokens are stable from prism
                  key={i}
                  className={lineProps.className}
                  style={lineProps.style as React.CSSProperties}
                >
                  {line.map((token, key) => {
                    const tokenProps = getTokenProps({ token });
                    return (
                      <span
                        // biome-ignore lint/suspicious/noArrayIndexKey: tokens are stable from prism
                        key={key}
                        className={tokenProps.className}
                        style={tokenProps.style as React.CSSProperties}
                      >
                        {tokenProps.children ?? token.content}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
