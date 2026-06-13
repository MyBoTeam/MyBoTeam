import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/button';
import { Popover, PopoverContent, PopoverTrigger } from '../components/popover';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <h4 className="mb-2 text-sm font-semibold">Popover Title</h4>
        <p className="text-sm text-muted-foreground">
          This is the popover content with some information.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const Glow: Story = {
  render: () => (
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant="outline">Trigger</Button>
      </PopoverTrigger>
      <PopoverContent glow className="w-64">
        <p className="text-sm">Popover with glow effect.</p>
      </PopoverContent>
    </Popover>
  ),
};
