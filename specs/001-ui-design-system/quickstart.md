# Quickstart: @myboteam/ui

**Date**: 2026-06-11 | **Phase 1**

## For Consumers (apps/web, future apps)

### 1. Install

```bash
pnpm add @myboteam/ui
```

(Within the monorepo, this resolves to `workspace:*` automatically.)

### 2. Import Styles

In your app's main CSS file, add these imports before any app-specific styles:

```css
@import '@myboteam/ui/tokens.css';
@import '@myboteam/ui/themes.css';
@import '@myboteam/ui/glass.css';
```

This makes Tailwind utility classes and theme variables available.

### 3. Use Components

```typescript
import { Button, Card, CardContent, Dialog, DialogContent } from '@myboteam/ui';

function MyComponent() {
  return (
    <Card>
      <CardContent>
        <Button variant="default">Click me</Button>
        <Button variant="glass" glass={{ blur: 20, transparency: 0.5 }}>
          Glass button
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 4. Override Dialog Close Label (i18n)

```typescript
import { DialogContent } from '@myboteam/ui';
import { useTranslation } from 'react-i18next';

function MyDialog() {
  const { t } = useTranslation('common');
  return (
    <DialogContent closeLabel={t('buttons.close')}>
      {/* ... */}
    </DialogContent>
  );
}
```

## For Package Developers

### 1. Development

```bash
# Run Storybook for isolated component development
pnpm -F @myboteam/ui storybook

# Run build
pnpm -F @myboteam/ui build

# Run type checking
pnpm -F @myboteam/ui check
```

### 2. Add a New shadcn Component

The `components.json` lives in `packages/ui/`. To add a new shadcn component:

```bash
pnpm -F @myboteam/ui dlx shadcn@latest add [component-name]
```

This places the component in `packages/ui/src/components/`.

### 3. Create a Story

Stories live alongside components in `src/stories/`:

```typescript
// src/stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'glass', 'frosted', 'fluted', 'crystal'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button' },
};
```
