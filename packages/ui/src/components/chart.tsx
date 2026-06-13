'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '../utils/cn';
import { type ChartConfig, ChartContext, ChartStyle, useChart } from './chart-helpers';

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
    glow?: boolean;
  }
>(({ id, className, children, config, glow = false, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          glow && 'shadow-lg shadow-primary-700/20',
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipContentProps = React.ComponentProps<typeof RechartsPrimitive.Tooltip> & {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    name?: string;
    value?: number | string;
    color?: string;
    payload?: {
      fill?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps &
    React.ComponentProps<'div'> & {
      indicator?: 'dot' | 'line' | 'dashed';
      glow?: boolean;
    }
>(({ active, payload, className, indicator = 'dot', glow = false, ...props }, ref) => {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'grid min-w-[8rem] items-start gap-1.5 rounded-lg border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md',
        glow && 'shadow-lg shadow-primary-700/30',
        className,
      )}
      {...props}
    >
      {payload.map((item, _index) => {
        const configItem = config[item.dataKey as string] || config[item.name as string];
        const indicatorColor = (item.payload as { fill?: string })?.fill || item.color;

        return (
          <div
            key={item.dataKey || item.name}
            className={cn(
              'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
              indicator === 'line' && 'items-center',
            )}
          >
            {configItem?.icon ? (
              <configItem.icon />
            ) : (
              <div
                className={cn(
                  'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
                  indicator === 'dot' && 'h-2.5 w-2.5',
                  indicator === 'line' && 'h-0.5 w-4',
                  indicator === 'dashed' && 'h-0.5 w-4 border-1.5 border-dashed bg-transparent',
                )}
                style={
                  {
                    '--color-bg': indicatorColor,
                    '--color-border': indicatorColor,
                  } as React.CSSProperties
                }
              />
            )}
            <div
              className={cn(
                'flex flex-1 justify-between leading-none',
                indicator === 'line' && 'items-center',
              )}
            >
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">{configItem?.label || item.name}</span>
                {item.value && (
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    payload?: Array<{
      value?: string;
      dataKey?: string;
      color?: string;
      [key: string]: unknown;
    }>;
    verticalAlign?: 'top' | 'bottom';
    glow?: boolean;
  }
>(({ className, payload, verticalAlign = 'bottom', glow = false, ...props }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-2' : 'pt-2',
        glow && 'shadow-md shadow-primary-700/20',
        className,
      )}
      {...props}
    >
      {payload.map((item) => {
        const key = `${item.dataKey || item.value}`;
        const configItem = config[key];

        return (
          <div
            key={item.value}
            className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
          >
            {configItem?.icon ? (
              <configItem.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {configItem?.label}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = 'ChartLegend';

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
};
