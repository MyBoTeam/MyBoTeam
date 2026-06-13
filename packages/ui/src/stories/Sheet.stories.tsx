import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../components/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/sheet';

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
} satisfies Meta<typeof Sheet>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">Open Sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Title</SheetTitle>
            <SheetDescription>This is a sheet panel that slides in from the side.</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">Sheet content goes here.</p>
          </div>
          <SheetFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  },
};

export const LeftSide: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">Open Left Sheet</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Left Sheet</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground">Sheet on the left side.</p>
        </SheetContent>
      </Sheet>
    );
  },
};

export const Glow: Story = {
  render: () => {
    const [open] = useState(true);
    return (
      <Sheet open={open}>
        <SheetContent glow side="right">
          <SheetHeader>
            <SheetTitle>Sheet with Glow</SheetTitle>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  },
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <Sheet open>
      <SheetContent data-testid="sheet-content">
        <SheetHeader>
          <SheetTitle>Check</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const content = canvas.getByTestId('sheet-content');
    await expect(content).toBeVisible();
  },
};
