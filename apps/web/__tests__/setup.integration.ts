import '@testing-library/jest-dom/vitest';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { vi } from 'vitest';

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

const localesDir = path.resolve(process.cwd(), 'locales/en');
const translations: Record<string, Record<string, unknown>> = {};

if (fs.existsSync(localesDir)) {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const ns = file.replace('.json', '');
    translations[ns] = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
  }
}

function getNestedValue(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(text: string, options?: Record<string, unknown>): string {
  if (!options) {
    return text;
  }
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return options[key] !== undefined ? String(options[key]) : match;
  });
}

function asChildWrapper({
  children,
  asChild,
  ...props
}: {
  children: React.ReactNode;
  asChild?: boolean;
  [key: string]: unknown;
}) {
  return React.createElement('div', props, children);
}

const DropdownMenuCtx = React.createContext<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({});

vi.mock('undici', () => ({
  ProxyAgent: class ProxyAgent {},
  Agent: class Agent {},
  fetch: vi.fn(),
  setGlobalDispatcher: vi.fn(),
  getGlobalDispatcher: vi.fn(),
}));

vi.mock('@myboteam/ui', () => ({
  Alert: asChildWrapper,
  AlertAction: asChildWrapper,
  AlertDescription: asChildWrapper,
  AlertTitle: asChildWrapper,
  Avatar: asChildWrapper,
  AvatarFallback: asChildWrapper,
  AvatarImage: ({ alt, src }: { alt?: string; src?: string }) =>
    React.createElement('img', { alt, src }),
  Badge: asChildWrapper,
  badgeVariants: {},
  Button: (props: { children?: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('button', props, props.children),
  buttonVariants: {},
  Card: asChildWrapper,
  CardAction: asChildWrapper,
  CardContent: asChildWrapper,
  CardDescription: asChildWrapper,
  CardFooter: asChildWrapper,
  CardHeader: asChildWrapper,
  CardTitle: asChildWrapper,
  Dialog: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    React.createElement('div', { 'data-state': open ? 'open' : 'closed' }, children),
  DialogClose: asChildWrapper,
  DialogContent: asChildWrapper,
  DialogDescription: asChildWrapper,
  DialogFooter: asChildWrapper,
  DialogHeader: asChildWrapper,
  DialogOverlay: asChildWrapper,
  DialogPortal: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  DialogTitle: asChildWrapper,
  DialogTrigger: asChildWrapper,
  DropdownMenu: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) =>
    React.createElement(
      DropdownMenuCtx.Provider,
      { value: { open, onOpenChange } },
      React.createElement('div', { 'data-state': open ? 'open' : 'closed' }, children),
    ),
  DropdownMenuCheckboxItem: asChildWrapper,
  DropdownMenuContent: asChildWrapper,
  DropdownMenuGroup: asChildWrapper,
  DropdownMenuItem: asChildWrapper,
  DropdownMenuLabel: asChildWrapper,
  DropdownMenuPortal: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  DropdownMenuRadioGroup: asChildWrapper,
  DropdownMenuRadioItem: asChildWrapper,
  DropdownMenuSeparator: () => React.createElement('hr'),
  DropdownMenuShortcut: asChildWrapper,
  DropdownMenuSub: asChildWrapper,
  DropdownMenuSubContent: asChildWrapper,
  DropdownMenuSubTrigger: asChildWrapper,
  DropdownMenuTrigger: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    asChild?: boolean;
    [key: string]: unknown;
  }) => {
    const ctx = React.useContext(DropdownMenuCtx);
    return React.createElement(
      'div',
      {
        ...props,
        onPointerDown: (e: React.PointerEvent) => {
          e.stopPropagation();
          ctx.onOpenChange?.(!ctx.open);
        },
      },
      children,
    );
  },
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) =>
    React.createElement('input', props),
  Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) =>
    React.createElement('label', props),
  ScrollArea: asChildWrapper,
  ScrollBar: asChildWrapper,
  Separator: () => React.createElement('hr'),
  Skeleton: (props: { className?: string; [key: string]: unknown }) =>
    React.createElement('div', { ...props, 'data-testid': 'skeleton' }),
  Switch: (props: {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    [key: string]: unknown;
  }) =>
    React.createElement('button', {
      role: 'switch',
      'aria-checked': props.checked,
      onClick: () => props.onCheckedChange?.(!props.checked),
    }),
  Tabs: asChildWrapper,
  TabsContent: asChildWrapper,
  TabsList: asChildWrapper,
  TabsTrigger: asChildWrapper,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) =>
    React.createElement('textarea', props),
  Tooltip: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  TooltipContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', { role: 'tooltip' }, children),
  TooltipProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  TooltipTrigger: asChildWrapper,
  CodeBlock: asChildWrapper,
  StreamingText: ({
    children,
    text,
    className,
  }: {
    children?: (text: string) => React.ReactNode;
    text: string;
    isComplete?: boolean;
    onComplete?: () => void;
    className?: string;
  }) => {
    return React.createElement(
      'div',
      { className },
      React.createElement(React.Fragment, null, ...[children ? children(text) : null]),
    );
  },
  useStreamingState: (messageId: string, isLatest: boolean, isRunning: boolean) => {
    const [complete, setComplete] = React.useState(false);
    // biome-ignore lint/correctness/useExhaustiveDependencies: messageId changes on rerender, valid as dep in hook mock
    React.useEffect(() => {
      setComplete(false);
    }, [messageId]);
    return {
      shouldStream: isLatest && isRunning && !complete,
      isComplete: !isLatest || !isRunning || complete,
      onComplete: () => setComplete(true),
    };
  },
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(' '),
  darkTheme: '',
  lightTheme: '',
  duration: {},
  easing: {},
  keyframes: {},
  colors: {},
  colorTokens: {},
  shadows: {},
  radius: {},
  spacing: {},
  fontFamily: {},
  fontSize: {},
  fontWeight: {},
  buttonPress: {},
  cardHover: {},
  settingsTransitions: {},
  settingsVariants: {},
  springs: {},
  staggerContainer: {},
  staggerItem: {},
  variants: {},
  hoverEffects: {},
  getGlassCSSVars: () => '',
  getGlassStyles: () => ({}),
  GlassAlert: asChildWrapper,
  GlassAvatar: asChildWrapper,
  GlassAvatarFallback: asChildWrapper,
  GlassAvatarImage: () => null,
  GlassBadge: asChildWrapper,
  GlassButton: asChildWrapper,
  GlassCard: asChildWrapper,
  GlassDialogContent: asChildWrapper,
  GlassDropdownMenuContent: asChildWrapper,
  GlassInput: asChildWrapper,
  GlassLabel: asChildWrapper,
  GlassScrollArea: asChildWrapper,
  GlassScrollBar: asChildWrapper,
  GlassSeparator: () => React.createElement('hr'),
  GlassSkeleton: asChildWrapper,
  GlassSwitch: asChildWrapper,
  GlassTabsContent: asChildWrapper,
  GlassTabsList: asChildWrapper,
  GlassTabsTrigger: asChildWrapper,
  GlassTextarea: asChildWrapper,
  GlassTooltipContent: asChildWrapper,
}));

vi.mock('@/components/dropdown-menu-sub', () => ({
  DropdownMenuSub: asChildWrapper,
  DropdownMenuSubContent: asChildWrapper,
  DropdownMenuSubTrigger: asChildWrapper,
  DropdownMenuRadioGroup: asChildWrapper,
  DropdownMenuRadioItem: asChildWrapper,
}));

vi.mock('react-i18next', () => ({
  useTranslation: (ns?: string) => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const namespace = ns || 'common';
      const nsData = translations[namespace];
      const value = nsData ? getNestedValue(nsData, key) : undefined;
      if (value) {
        return interpolate(value, options);
      }

      return ns ? `${ns}:${key}` : key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const g = global as unknown as { window: { myboteam?: unknown } };
if (!g.window) {
  g.window = {};
}
g.window.myboteam = {
  ...(g.window.myboteam ? (g.window.myboteam as object) : {}),
  pickFolder: vi.fn().mockResolvedValue(null),
  pickFiles: vi.fn().mockResolvedValue([]),
  getFilePath: vi.fn((file: File) => file.name),
  processDroppedFiles: vi.fn().mockResolvedValue([]),
  onTaskProgress: vi.fn().mockReturnValue(() => {}),
  onTaskUpdate: vi.fn().mockReturnValue(() => {}),
  onTaskSummary: vi.fn().mockReturnValue(() => {}),
  onTodoUpdate: vi.fn().mockReturnValue(() => {}),
  onDaemonDisconnected: vi.fn().mockReturnValue(() => {}),
  onDaemonReconnected: vi.fn().mockReturnValue(() => {}),
  onDaemonReconnectFailed: vi.fn().mockReturnValue(() => {}),
  daemonPing: vi.fn().mockResolvedValue({ status: 'ok' }),
  onAuthError: vi.fn().mockReturnValue(() => {}),
  onWorkspaceChanged: vi.fn().mockReturnValue(() => {}),
  getEnabledSkills: vi.fn().mockResolvedValue([]),
  resyncSkills: vi.fn().mockResolvedValue(undefined),
  getConnectors: vi.fn().mockResolvedValue([]),
  setConnectorEnabled: vi.fn().mockResolvedValue(undefined),
};
