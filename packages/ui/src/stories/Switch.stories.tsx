import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Label } from '../components/label';
import { Switch } from '../components/switch';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm'],
    },
  },
} satisfies Meta<typeof Switch>;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <div className="flex items-center gap-2">
        <Switch id="airplane-mode" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="airplane-mode">Airplane Mode</Label>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="disabled-switch" disabled />
      <Label htmlFor="disabled-switch">Disabled</Label>
    </div>
  ),
};

export const Small: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return (
      <div className="flex items-center gap-2">
        <Switch id="small-switch" size="sm" checked={checked} onCheckedChange={setChecked} />
        <Label htmlFor="small-switch">Small Switch</Label>
      </div>
    );
  },
};
