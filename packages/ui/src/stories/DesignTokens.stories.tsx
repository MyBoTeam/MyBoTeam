import type { Meta, StoryObj } from '@storybook/react-vite';
import { themeDefinitions } from '../themes/themes';
import { duration, easing } from '../tokens/animations';
import { primaryScales, scaleSteps } from '../tokens/colorScales';
import { colorTokens } from '../tokens/colors';
import { letterSpacing } from '../tokens/letterSpacing';
import { lineHeight } from '../tokens/lineHeight';
import { mediaQuery } from '../tokens/mediaQuery';
import { opacity } from '../tokens/opacity';
import { shadows } from '../tokens/shadows';
import { radius, spacing } from '../tokens/spacing';
import { fontFamily, fontSize, fontWeight } from '../tokens/typography';

const meta = {
  title: '0 Design Tokens/Overview',
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
      style={{ backgroundColor: value.startsWith('oklch') ? value : `hsl(${value})` }}
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
        <h2 className="text-lg font-medium mb-4">Color Themes</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Six accent themes that override <code className="text-xs font-mono">--primary</code>,{' '}
          <code className="text-xs font-mono">--accent</code>,{' '}
          <code className="text-xs font-mono">--ring</code>, and{' '}
          <code className="text-xs font-mono">--theme-bg-gradient</code>. Available in both light
          and dark modes via Storybook toolbar.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themeDefinitions.map((theme) => (
            <div key={theme.className} className="rounded-lg border overflow-hidden">
              <div className="p-3 border-b bg-muted/30">
                <h3 className="text-sm font-medium">{theme.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{theme.className}</p>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1.5">Light</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-5 w-5 rounded border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${theme.light.primary})` }}
                    />
                    <span className="text-xs font-mono">primary</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {theme.light.primary}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-5 w-5 rounded border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${theme.light.accent})` }}
                    />
                    <span className="text-xs font-mono">accent</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {theme.light.accent}
                    </span>
                  </div>
                  <div
                    className="h-8 rounded mt-2 flex items-center justify-center text-xs"
                    style={{ background: theme.light['theme-bg-gradient'], color: '#000' }}
                  >
                    bg gradient
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1.5">Dark</h4>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-5 w-5 rounded border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${theme.dark.primary})` }}
                    />
                    <span className="text-xs font-mono">primary</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {theme.dark.primary}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-5 w-5 rounded border border-border shrink-0"
                      style={{ backgroundColor: `hsl(${theme.dark.accent})` }}
                    />
                    <span className="text-xs font-mono">accent</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {theme.dark.accent}
                    </span>
                  </div>
                  <div
                    className="h-8 rounded mt-2 flex items-center justify-center text-xs"
                    style={{ background: theme.dark['theme-bg-gradient'], color: '#fff' }}
                  >
                    bg gradient
                  </div>
                </div>
                <div>
                  <h4 className="text-xs text-muted-foreground mb-1.5">Primary Scale</h4>
                  <div className="flex h-6 rounded overflow-hidden border border-border">
                    {scaleSteps.map((step) => {
                      const scale = primaryScales[theme.className];
                      return (
                        <div
                          key={step}
                          className="flex-1"
                          style={{ backgroundColor: `hsl(${scale[step]})` }}
                          title={`${step}: hsl(${scale[step]})`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-0.5">
                    {scaleSteps.map((step) => (
                      <span key={step} className="text-[10px] text-muted-foreground">
                        {step}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
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
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Opacity</h2>
        <div className="rounded-lg border p-4">
          <dl className="space-y-2">
            {Object.entries(opacity).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <dt className="text-xs text-muted-foreground w-16">opacity-{key}</dt>
                <dd className="text-xs font-mono w-12">{value}</dd>
                <div
                  className="flex-1 h-4 rounded bg-muted-foreground/20"
                  style={{ opacity: value }}
                />
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Letter Spacing</h2>
        <div className="rounded-lg border p-4">
          <dl className="space-y-2">
            {Object.entries(letterSpacing).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <dt className="text-xs text-muted-foreground w-16">{key}</dt>
                <dd className="text-xs font-mono w-16">{value}</dd>
                <span className="text-sm" style={{ letterSpacing: value }}>
                  The quick brown fox
                </span>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Line Height</h2>
        <div className="rounded-lg border p-4">
          <dl className="space-y-2">
            {Object.entries(lineHeight).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3">
                <dt className="text-xs text-muted-foreground w-16 shrink-0 mt-1">{key}</dt>
                <dd className="text-xs font-mono w-12 shrink-0 mt-1">{value}</dd>
                <div
                  className="text-xs bg-muted/30 rounded px-2 py-1"
                  style={{ lineHeight: value }}
                >
                  Line height {key} ({value})&nbsp;—&nbsp;The quick brown fox jumps over the lazy
                  dog. Pack my box with five dozen liquor jugs.
                </div>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-4">Media Query</h2>
        <div className="rounded-lg border p-4">
          <dl className="space-y-2">
            {Object.entries(mediaQuery).map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-muted-foreground">{key}</dt>
                <dd className="text-xs font-mono">max-width: {value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  ),
};
