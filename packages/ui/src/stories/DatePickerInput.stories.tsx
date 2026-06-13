import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePickerInput } from '../components/date-picker-input';

const meta = {
  title: 'UI/DatePickerInput',
  component: DatePickerInput,
  tags: ['autodocs'],
} satisfies Meta<typeof DatePickerInput>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Pick a date',
  },
};

export const WithValue: Story = {
  args: {
    value: new Date(2025, 0, 15),
  },
};
