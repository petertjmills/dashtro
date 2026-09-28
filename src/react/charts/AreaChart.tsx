import { EvilAreaChart } from '../evilcharts/recharts-area-chart.js';
import { toEvilConfig } from '../evil-config.js';
import { createValueFormatter } from '../format.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { EMPTY_ROWS, normalizeSeries } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface AreaChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {
  /** Stack the areas. */
  stacked?: boolean;
}

/** An area chart, built on EvilCharts, with a gradient fill per series. */
export function AreaChart({
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
  children,
}: AreaChartProps) {
  const { rows, controls } = useChartFilters(filters, data ?? EMPTY_ROWS);
  const normalized = normalizeSeries(series, rows, x, colors);
  const formatValue = createValueFormatter(valueFormat);
  const evilConfig = toEvilConfig(normalized, config);
  const isStacked = stacked || normalized.some((item) => item.stackId);

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
        <EvilAreaChart
          data={rows}
          config={evilConfig}
          xDataKey={x}
          stackType={isStacked ? 'stacked' : 'default'}
          className="h-full w-full"
        >
          {showGrid ? <EvilAreaChart.Grid /> : null}
          <EvilAreaChart.XAxis dataKey={x} tickFormatter={formatValue} />
          <EvilAreaChart.YAxis tickFormatter={formatValue} />
          {showTooltip ? <EvilAreaChart.Tooltip /> : null}
          {showLegend ? <EvilAreaChart.Legend /> : null}
          {children ??
            normalized.map((item) => (
              <EvilAreaChart.Area key={item.key} dataKey={item.key} variant="gradient" />
            ))}
        </EvilAreaChart>
      </div>
    </ChartFrame>
  );
}
