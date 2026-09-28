import { EvilBarChart } from '../evilcharts/recharts-bar-chart.js';
import { toEvilConfig } from '../evil-config.js';
import { createValueFormatter } from '../format.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { EMPTY_ROWS, axisWidth, normalizeSeries, truncateLabel } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface BarChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {
  /** Stack the bars. */
  stacked?: boolean;
  /** Render horizontal bars. */
  horizontal?: boolean;
}

/**
 * A bar chart, built on EvilCharts. The `series` prop generates one bar per
 * column; pass `children` to write the EvilCharts parts yourself.
 */
export function BarChart({
  data,
  filters,
  x,
  series,
  config,
  colors,
  title,
  description,
  className,
  chartClassName,
  height = 320,
  bare,
  showLegend = false,
  showGrid = true,
  showTooltip = true,
  valueFormat,
  stacked = false,
  horizontal = false,
  children,
}: BarChartProps) {
  const { rows, controls } = useChartFilters(filters, data ?? EMPTY_ROWS);
  const normalized = normalizeSeries(series, rows, x, colors);
  const formatValue = createValueFormatter(valueFormat);
  const evilConfig = toEvilConfig(normalized, config);
  const isStacked = stacked || normalized.some((item) => item.stackId);
  const categoryWidth =
    horizontal && x ? axisWidth(rows.map((row) => String(row[x] ?? ''))) : undefined;
  const categoryFormatter = categoryWidth
    ? (value: unknown) => truncateLabel(value, categoryWidth)
    : undefined;

  return (
    <ChartFrame
      title={title}
      description={description}
      controls={controls}
      empty={rows.length === 0}
      height={height}
      bare={bare}
      className={className}
    >
      <div className={cn('w-full', chartClassName)} style={{ height }}>
        <EvilBarChart
          data={rows}
          config={evilConfig}
          xDataKey={x}
          layout={horizontal ? 'horizontal' : 'vertical'}
          stackType={isStacked ? 'stacked' : 'default'}
          className="h-full w-full"
        >
          {showGrid ? <EvilBarChart.Grid vertical={horizontal} /> : null}
          {horizontal ? (
            <>
              <EvilBarChart.XAxis tickFormatter={formatValue} />
              <EvilBarChart.YAxis dataKey={x} tickFormatter={categoryFormatter} />
            </>
          ) : (
            <>
              <EvilBarChart.XAxis dataKey={x} tickFormatter={formatValue} />
              <EvilBarChart.YAxis tickFormatter={formatValue} />
            </>
          )}
          {showTooltip ? <EvilBarChart.Tooltip /> : null}
          {showLegend ? <EvilBarChart.Legend /> : null}
          {children ??
            normalized.map((item) => (
              <EvilBarChart.Bar key={item.key} dataKey={item.key} variant="default" />
            ))}
        </EvilBarChart>
      </div>
    </ChartFrame>
  );
}
