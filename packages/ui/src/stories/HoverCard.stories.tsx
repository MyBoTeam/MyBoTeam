import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/hover-card';

const meta = {
  title: 'UI/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@username</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold">Username</h4>
          <p className="text-sm text-muted-foreground">A brief description or bio for this user.</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Glow: Story = {
  render: () => (
    <HoverCard open>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover me</Button>
      </HoverCardTrigger>
      <HoverCardContent glow className="w-64">
        <p className="text-sm">Content with glow effect.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};
