# Package API Contract: @myboteam/ui

**Date**: 2026-06-11 | **Phase 1**

## Package Exports Map

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./tokens.css": "./dist/tokens.css",
    "./themes.css": "./dist/themes.css",
    "./glass.css": "./dist/glass.css"
  }
}
```

## JavaScript/TypeScript Exports

### Components

All components are named exports from the package root:

```typescript
import {
  // Standard shadcn (fresh install)
  Alert, AlertDescription, AlertTitle,
  Avatar, AvatarFallback, AvatarImage,
  Badge, badgeVariants,
  Button, buttonVariants,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  CodeBlock,
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
  Input,
  Label,
  ScrollArea, ScrollBar,
  Separator,
  Skeleton,
  StreamingText,
  Switch,
  Tabs, TabsContent, TabsList, TabsTrigger,
  Textarea,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,

  // Glass variants (from @glass-ui registry)
  GlassAlert, GlassAvatar, GlassBadge, GlassButton, GlassCard,
  GlassDialog, GlassDropdownMenu, GlassInput, GlassLabel,
  GlassScrollArea, GlassSeparator, GlassSkeleton, GlassSwitch,
  GlassTabs, GlassTextarea, GlassTooltip,
} from '@myboteam/ui';
```

### Utilities

```typescript
import { cn, type GlassCustomization, getGlassStyles, getGlassCSSVars, hoverEffects, type HoverEffect } from '@myboteam/ui';
```

### Tokens

```typescript
import { colors, typography, spacing, shadows, animations } from '@myboteam/ui';
```

### Themes

```typescript
import { lightTheme, darkTheme, type ThemeDefinition } from '@myboteam/ui';
```

### Animations

```typescript
import { springs, variants, staggerContainer, staggerItem, cardHover, buttonPress, settingsVariants, settingsTransitions } from '@myboteam/ui';
```

## CSS Exports

### tokens.css

Contains the Tailwind v4 `@theme` block with shadcn default design tokens.

```css
@import '@myboteam/ui/tokens.css';
```

### themes.css

Contains `:root` and `.dark` CSS custom property definitions (shadcn defaults).

```css
@import '@myboteam/ui/themes.css';
```

### glass.css

Contains glass morphism utility classes.

```css
@import '@myboteam/ui/glass.css';
```

## Component API Notes

### Dialog — `closeLabel` prop

```typescript
interface DialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  variant?: 'default' | 'glass' | 'frosted' | 'fluted' | 'crystal';
  glass?: GlassCustomization;
  closeLabel?: string; // defaults to "Close". Override for i18n.
}
```

### All other components

Use their standard shadcn API as installed by the CLI. Fresh components follow shadcn conventions.

## Peer Dependencies

| Package | Version |
|---|---|
| react | ^19.0.0 |
| react-dom | ^19.0.0 |

## Consumer Integration Pattern

```typescript
// 1. In the app's main CSS file:
@import '@myboteam/ui/tokens.css';
@import '@myboteam/ui/themes.css';
@import '@myboteam/ui/glass.css';

// 2. In TypeScript files:
import { Button, Card } from '@myboteam/ui';

// 3. In package.json:
{
  "dependencies": {
    "@myboteam/ui": "workspace:*"
  }
}
```
