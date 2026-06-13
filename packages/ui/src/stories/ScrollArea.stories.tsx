import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from '../components/scroll-area';

const meta = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-48 w-80 rounded-md border">
      <div className="p-4">
        <h4 className="mb-3 text-sm font-medium">Long Content</h4>
        {Array.from({ length: 20 }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static list, items are stable
          <p key={i} className="text-sm text-muted-foreground pb-2">
            Item {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
