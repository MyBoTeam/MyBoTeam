import type { Meta, StoryObj } from '@storybook/react-vite';
import { Carousel } from '../components/carousel';

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs'],
} satisfies Meta<typeof Carousel>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-96">
      <Carousel className="border">
        <div className="flex h-48 items-center justify-center bg-primary/10">
          <p className="text-lg font-semibold">Slide 1</p>
        </div>
        <div className="flex h-48 items-center justify-center bg-primary/20">
          <p className="text-lg font-semibold">Slide 2</p>
        </div>
        <div className="flex h-48 items-center justify-center bg-primary/30">
          <p className="text-lg font-semibold">Slide 3</p>
        </div>
      </Carousel>
    </div>
  ),
};

export const CssCheck: Story = {
  tags: ['ai-generated'],
  render: () => (
    <div className="w-96">
      <Carousel data-testid="carousel">
        <div className="flex h-32 items-center justify-center">Item</div>
      </Carousel>
    </div>
  ),
  play: async ({ canvas }) => {
    const { expect } = await import('storybook/test');
    const carousel = canvas.getByTestId('carousel');
    await expect(carousel).toHaveTextContent('Item');
  },
};
