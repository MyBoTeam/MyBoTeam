import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';
import { Button } from '../components/button';
import { Toaster } from '../components/sonner';

const meta = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs'],
} satisfies Meta<typeof Toaster>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div>
      <Toaster />
      <Button variant="outline" onClick={() => toast('Hello from Sonner!')}>
        Show Toast
      </Button>
      <Button variant="outline" onClick={() => toast.success('Success!')}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error('Error!')}>
        Error
      </Button>
    </div>
  ),
};
