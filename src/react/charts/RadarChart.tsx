import { EvilRadarChart } from '../evilcharts/recharts-radar-chart.js';
import { toEvilConfig } from '../evil-config.js';
import { useChartFilters } from '../filter-controls.js';
import { ChartFrame } from '../frame.js';
import { EMPTY_ROWS, findCategoryKey, normalizeSeries } from '../series.js';
import type { ChartDisplayProps, ChartLayoutProps, ChartSeriesProps, ChartSourceProps } from '../types.js';
import { cn } from '../utils.js';

export interface RadarChartProps
  extends ChartSourceProps,
    ChartSeriesProps,
    ChartLayoutProps,
    ChartDisplayProps {}

/** A radar chart, built on EvilCharts. */
export function RadarChart({
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
  children,
}: RadarChartProps) {
  const { rows, controls } = useChartFilters(filters, data ?? EMPTY_ROWS);
  const normalized = normalizeSeries(series, rows, x, colors);
  const evilConfig = toEvilConfig(normalized, config);
  const categoryKey = x ?? findCategoryKey(rows, normalized.map((item) => item.key));

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
        <EvilRadarChart data={rows} config={evilConfig} className="h-full w-full">
          <EvilRadarChart.PolarGrid />
          {categoryKey ? <EvilRadarChart.PolarAngleAxis dataKey={categoryKey} /> : null}
          {showTooltip ? <EvilRadarChart.Tooltip /> : null}
          {showLegend ? <EvilRadarChart.Legend /> : null}
          {children ??
            normalized.map((item) => (
              <EvilRadarChart.Radar key={item.key} dataKey={item.key} variant="filled" />
            ))}
        </EvilRadarChart>
      </div>
    </ChartFrame>
  );
}
