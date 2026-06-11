import type { Meta, StoryObj } from '@storybook/react-vite';
import { duration, easing } from '../tokens/animations';
import { colorTokens } from '../tokens/colors';
import { shadows } from '../tokens/shadows';
import { radius, spacing } from '../tokens/spacing';
import { fontFamily, fontSize, fontWeight } from '../tokens/typography';

const meta = {
  title: 'Design Tokens/Overview',
  component: () => null,
  tags: ['autodocs'],
} satisfies Meta;

// biome-ignore lint/style/noDefaultExport: Storybook requires default export for meta
export default meta;
type Story = StoryObj;

function Swatch({ value }: { value: string }) {
  return (
    <div
      className="h-6 w-6 rounded border border-border shrink-0"
      style={{ backgroundColor: value }}
    />
  );
}

export const AllTokens: Story = {
  render: () => (
    <div className="space-y-10 p-6">
      <div>
        <h2 className="text-lg font-medium mb-4">Color Tokens</h2>
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Variable</th>
                <th className="text-left p-3 font-medium">Light</th>
                <th className="text-left p-3 font-medium">Dark</th>
                <th className="text-left p-3 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {colorTokens.map((token) => (
                <tr key={token.variable} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{token.variable}</td>
                  <td className="p-3 font-mono text-xs">{token.light}</td>
                  <td className="p-3 font-mono text-xs">{token.dark}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Swatch value={token.light} />
                      <Swatch value={token.dark} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Typography</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Font Family</h3>
            <dl className="space-y-2">
              {Object.entries(fontFamily).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="text-xs font-mono truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Font Weight</h3>
            <dl className="space-y-2">
              {Object.entries(fontWeight).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="text-xs font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Font Size</h3>
            <dl className="space-y-2">
              {Object.entries(fontSize).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="text-xs font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Spacing & Radius</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Spacing</h3>
            <dl className="space-y-1">
              {Object.entries(spacing).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <dt className="text-xs text-muted-foreground w-8">{key}</dt>
                  <dd className="text-xs font-mono w-20">{value}</dd>
                  <div className="h-2 bg-muted-foreground/20 rounded" style={{ width: value }} />
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Border Radius</h3>
            <dl className="space-y-2">
              {Object.entries(radius).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <dt className="text-xs text-muted-foreground w-12">{key}</dt>
                  <dd className="text-xs font-mono w-20">{value}</dd>
                  <div
                    className="h-6 w-16 bg-muted-foreground/20"
                    style={{ borderRadius: value }}
                  />
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Shadows</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(shadows).map(([key, value]) => (
            <div key={key} className="rounded-lg border p-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">{key}</h3>
              <div className="h-16 w-full rounded-md bg-card mb-2" style={{ boxShadow: value }} />
              <p className="text-xs font-mono text-muted-foreground break-all">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Animation</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Easing</h3>
            <dl className="space-y-2">
              {Object.entries(easing).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="text-xs font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Duration</h3>
            <dl className="space-y-2">
              {Object.entries(duration).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">{key}</dt>
                  <dd className="text-xs font-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  ),
};
