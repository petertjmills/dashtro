export { BarChart, type BarChartProps } from './charts/BarChart.js';
export { LineChart, type LineChartProps } from './charts/LineChart.js';
export { AreaChart, type AreaChartProps } from './charts/AreaChart.js';
export { PieChart, type PieChartProps } from './charts/PieChart.js';
export { RadarChart, type RadarChartProps } from './charts/RadarChart.js';
export { RadialChart, type RadialChartProps } from './charts/RadialChart.js';

export { ChartFrame, type ChartFrameProps } from './frame.js';

// The vendored EvilCharts registry. Use these to build a chart that Dashtro
// does not ship: compose an Evil*Chart root with its parts, or put your own
// Recharts marks inside a ChartContainer.
export { EvilAreaChart } from './evilcharts/recharts-area-chart.js';
export { EvilLineChart } from './evilcharts/recharts-line-chart.js';
export { EvilBarChart } from './evilcharts/recharts-bar-chart.js';
export { EvilPieChart } from './evilcharts/recharts-pie-chart.js';
export { EvilRadarChart } from './evilcharts/recharts-radar-chart.js';
export { EvilRadialChart } from './evilcharts/recharts-radial-chart.js';
export {
  ChartContainer,
  ChartStyle,
  useChart,
  type ChartConfig as EvilChartConfig,
} from './evilcharts/recharts-chart.js';
export {
  ChartTooltip,
  ChartTooltipContent,
  type TooltipRoundness,
  type TooltipVariant,
} from './evilcharts/recharts-tooltip.js';
export { ChartLegend, ChartLegendContent, type ChartLegendVariant } from './evilcharts/recharts-legend.js';
export { toEvilConfig, toEvilCategoryConfig } from './evil-config.js';

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card.js';

export {
  DEFAULT_COLORS,
  MAX_AXIS_WIDTH,
  axisWidth,
  buildChartConfig,
  findCategoryKey,
  inferSeries,
  normalizeSeries,
  prettify,
  truncateLabel,
  type NormalizedSeries,
} from './series.js';
export { createValueFormatter } from './format.js';
export { Slider, type SliderProps } from './slider.js';
export {
  applyFilters,
  createFilterState,
  defaultFilterValue,
  deriveSelectOptions,
  isDefaultFilterState,
  niceStep,
  numericDomain,
  selectOptions,
  FILTER_ALL,
  type ChartFilterValue,
  type NumericDomain,
  type SelectOption,
} from './filters.js';
export {
  FilterControls,
  useChartFilters,
  type FilterControlsProps,
  type UseChartFiltersResult,
} from './filter-controls.js';
export { runQuery, DashtroRequestError, type RunQueryOptions } from '../client/index.js';
export { cn } from './utils.js';

export type {
  ChartConfig,
  ChartDisplayProps,
  ChartFilter,
  ChartKind,
  ChartLayoutProps,
  ChartSeriesProps,
  ChartSourceProps,
  DashtroSeries,
  SeriesInput,
  ValueFormat,
} from './types.js';
