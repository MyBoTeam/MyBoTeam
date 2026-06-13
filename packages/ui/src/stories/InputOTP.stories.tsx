import type { Meta, StoryObj } from '@storybook/react-vite';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../components/input-otp';

const meta = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
} satisfies Meta<typeof InputOTP>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const WithSeparator: Story = {
  render: () => (
    <InputOTP maxLength={6}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

export const Glow: Story = {
  render: () => (
    <InputOTP maxLength={4} glow>
      <InputOTPGroup glow>
        <InputOTPSlot index={0} glow />
        <InputOTPSlot index={1} glow />
        <InputOTPSlot index={2} glow />
        <InputOTPSlot index={3} glow />
      </InputOTPGroup>
    </InputOTP>
  ),
};
