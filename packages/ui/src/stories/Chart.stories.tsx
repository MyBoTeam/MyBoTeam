import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/chart';

const chartData = [
  { month: 'Jan', revenue: 186 },
  { month: 'Feb', revenue: 305 },
  { month: 'Mar', revenue: 237 },
];

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--primary))',
  },
};

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
} satisfies Meta<typeof ChartContainer>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const Glow: Story = {
  render: () => (
    <ChartContainer config={chartConfig} glow className="h-64 w-full">
      <BarChart data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <ChartContainer config={chartConfig} data-testid="chart-container" className="h-64 w-full">
      <BarChart data={chartData}>
        <Bar dataKey="revenue" fill="var(--color-revenue)" />
      </BarChart>
    </ChartContainer>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const chart = canvas.getByTestId('chart-container');
    await expect(chart).toBeVisible();
  },
};
