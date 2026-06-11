import type { Meta, StoryObj } from '@storybook/react-vite';
import { StreamingText } from '../components/streaming-text';

const meta = {
  title: 'Custom/StreamingText',
  component: StreamingText,
  tags: ['autodocs'],
  argTypes: {
    speed: {
      control: { type: 'range', min: 10, max: 200, step: 10 },
    },
  },
} satisfies Meta<typeof StreamingText>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

const loremIpsum =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const Default: Story = {
  args: {
    text: loremIpsum,
    speed: 80,
  },
  render: (args) => (
    <div className="w-96 rounded-lg border p-4">
      <StreamingText {...args}>
        {(displayedText) => <p className="text-sm leading-relaxed">{displayedText}</p>}
      </StreamingText>
    </div>
  ),
};

export const Complete: Story = {
  args: {
    text: loremIpsum,
    isComplete: true,
  },
  render: (args) => (
    <div className="w-96 rounded-lg border p-4">
      <StreamingText {...args}>
        {(displayedText) => <p className="text-sm leading-relaxed">{displayedText}</p>}
      </StreamingText>
    </div>
  ),
};

export const Fast: Story = {
  args: {
    text: loremIpsum,
    speed: 200,
  },
  render: (args) => (
    <div className="w-96 rounded-lg border p-4">
      <StreamingText {...args}>
        {(displayedText) => <p className="text-sm leading-relaxed">{displayedText}</p>}
      </StreamingText>
    </div>
  ),
};
