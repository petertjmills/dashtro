import { EvilPieChart } from '../evilcharts/recharts-pie-chart.js';
import { toEvilCategoryConfig } from '../evil-config.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { DEFAULT_COLORS, EMPTY_ROWS, findCategoryKey, normalizeSeries } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface PieChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {
  innerRadius?: number | string;
  outerRadius?: number | string;
}

/** A pie chart, built on EvilCharts. `x` names the slices, the first series is the value. */
export function PieChart({
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
  innerRadius = '35%',
  outerRadius = '80%',
  children,
}: PieChartProps) {
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
        <EvilPieChart
          data={category.data}
          dataKey={valueKey ?? ''}
          nameKey={nameKey ?? ''}
          config={category.config}
          className="h-full w-full"
        >
          {showTooltip ? <EvilPieChart.Tooltip /> : null}
          {showLegend ? <EvilPieChart.Legend /> : null}
          {children ?? (
            <EvilPieChart.Pie
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              pieProps={{ isAnimationActive: 'auto' }}
            />
          )}
        </EvilPieChart>
      </div>
    </ChartFrame>
  );
}
