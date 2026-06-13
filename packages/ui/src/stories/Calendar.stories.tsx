import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '../components/calendar';

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
} satisfies Meta<typeof Calendar>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Calendar mode="single" className="rounded-md border p-3" />,
};

export const Glow: Story = {
  render: () => <Calendar mode="single" glow className="rounded-md border p-3" />,
};
