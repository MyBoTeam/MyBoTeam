import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../components/context-menu';

const meta = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
} satisfies Meta<typeof ContextMenu>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-32 w-80 items-center justify-center rounded-md border border-dashed text-sm">
        Right click here
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger
        data-testid="context-trigger"
        className="flex h-24 w-64 items-center justify-center rounded-md border border-dashed text-sm"
      >
        Right click
      </ContextMenuTrigger>
    </ContextMenu>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const trigger = canvas.getByTestId('context-trigger');
    await expect(trigger).toBeVisible();
  },
};
