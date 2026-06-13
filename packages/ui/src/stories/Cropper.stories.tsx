import type { Meta, StoryObj } from '@storybook/react-vite';
import { Cropper } from '../components/cropper';

const meta = {
  title: 'UI/Cropper',
  component: Cropper,
  tags: ['autodocs'],
} satisfies Meta<typeof Cropper>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop',
    aspect: 1,
  },
};

export const WideAspect: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=400&fit=crop',
    aspect: 16 / 9,
  },
};

export const Glow: Story = {
  args: {
    image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop',
    glow: true,
  },
};
