import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../components/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../components/drawer';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs'],
} satisfies Meta<typeof Drawer>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Drawer Title</DrawerTitle>
            <DrawerDescription>This drawer slides up from the bottom.</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">Drawer content goes here.</p>
          </div>
          <DrawerFooter>
            <Button onClick={() => setOpen(false)}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  },
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <Drawer open>
      <DrawerContent data-testid="drawer-content">
        <DrawerHeader>
          <DrawerTitle>Check</DrawerTitle>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const content = canvas.getByTestId('drawer-content');
    await expect(content).toBeVisible();
  },
};
