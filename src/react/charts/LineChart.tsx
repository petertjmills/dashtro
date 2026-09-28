import { EvilLineChart } from '../evilcharts/recharts-line-chart.js';
import { toEvilConfig } from '../evil-config.js';
import { createValueFormatter } from '../format.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { EMPTY_ROWS, normalizeSeries } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface LineChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {}

/** A line chart, built on EvilCharts. */
export function LineChart({
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
  children,
}: LineChartProps) {
  const { rows, controls } = useChartFilters(filters, data ?? EMPTY_ROWS);
  const normalized = normalizeSeries(series, rows, x, colors);
  const formatValue = createValueFormatter(valueFormat);
  const evilConfig = toEvilConfig(normalized, config);

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
        <EvilLineChart
          data={rows}
          config={evilConfig}
          xDataKey={x}
          className="h-full w-full"
        >
          {showGrid ? <EvilLineChart.Grid /> : null}
          <EvilLineChart.XAxis dataKey={x} tickFormatter={formatValue} />
          <EvilLineChart.YAxis tickFormatter={formatValue} />
          {showTooltip ? <EvilLineChart.Tooltip /> : null}
          {showLegend ? <EvilLineChart.Legend /> : null}
          {children ??
            normalized.map((item) => (
              <EvilLineChart.Line key={item.key} dataKey={item.key} strokeVariant="solid" />
            ))}
        </EvilLineChart>
      </div>
    </ChartFrame>
  );
}
