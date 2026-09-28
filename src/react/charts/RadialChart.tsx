import { EvilRadialChart } from '../evilcharts/recharts-radial-chart.js';
import { toEvilCategoryConfig } from '../evil-config.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { DEFAULT_COLORS, EMPTY_ROWS, findCategoryKey, normalizeSeries } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface RadialChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {
  innerRadius?: number | string;
  outerRadius?: number | string;
}

/** A radial bar chart, built on EvilCharts. */
export function RadialChart({
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
  showTooltip = true,
  innerRadius = '30%',
  outerRadius = '100%',
  children,
}: RadialChartProps) {
  const { rows, controls } = useChartFilters(filters, data ?? EMPTY_ROWS);
  const normalized = normalizeSeries(series, rows, x, colors);

  const valueKey = normalized[0]?.key;
  const nameKey = x ?? findCategoryKey(rows, [valueKey]);
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;
  const category = nameKey
    ? toEvilCategoryConfig(rows, nameKey, palette, config)
    : { data: rows, config: {} };
  const usable = rows.length > 0 && Boolean(valueKey) && Boolean(nameKey);

  return (
    <ChartFrame
      title={title}
      description={description}
      controls={controls}
      empty={!usable}
      height={height}
      bare={bare}
      className={className}
    >
      <div className={cn('w-full', chartClassName)} style={{ height }}>
        <EvilRadialChart
          data={category.data}
          config={category.config}
          nameKey={nameKey ?? ''}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          className="h-full w-full"
        >
          {showTooltip ? <EvilRadialChart.Tooltip /> : null}
          {showLegend ? <EvilRadialChart.Legend /> : null}
          {children ?? <EvilRadialChart.RadialBar dataKey={valueKey ?? ''} />}
        </EvilRadialChart>
      </div>
    </ChartFrame>
  );
}
