import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inbox } from 'lucide-react';
import {
  EmptyState,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '../components/empty-state';

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <EmptyState className="w-80">
      <EmptyStateIcon>
        <Inbox className="size-12" />
      </EmptyStateIcon>
      <EmptyStateTitle>No messages yet</EmptyStateTitle>
      <EmptyStateDescription>
        You don&apos;t have any messages. Start a conversation to get started.
      </EmptyStateDescription>
    </EmptyState>
  ),
};

export const Glow: Story = {
  render: () => (
    <EmptyState glass={{ blur: 'md', opacity: 0.1 }} className="w-80">
      <EmptyStateIcon>
        <Inbox className="size-12" />
      </EmptyStateIcon>
      <EmptyStateTitle>Empty with glass</EmptyStateTitle>
      <EmptyStateDescription>With glass effect applied.</EmptyStateDescription>
    </EmptyState>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <EmptyState data-testid="empty-state">
      <EmptyStateTitle>Check</EmptyStateTitle>
    </EmptyState>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const state = canvas.getByTestId('empty-state');
    await expect(state).toHaveTextContent('Check');
  },
};
