import type { Row } from '../runtime/types.js';
import type { ChartConfig as DashtroChartConfig } from './types.js';
import type { ChartConfig as EvilChartConfig } from './evilcharts/recharts-chart.js';
import type { NormalizedSeries } from './series.js';

/**
 * Map Dashtro's series colours to the EvilCharts config shape. EvilCharts takes
 * per-theme colour arrays, so a single colour becomes `{ light: [c], dark: [c] }`.
 */
export function toEvilConfig(
  series: NormalizedSeries[],
  config: DashtroChartConfig | undefined,
): EvilChartConfig {
  const evil: EvilChartConfig = {};

  for (const item of series) {
    evil[item.key] = {
      label: item.label,
      colors: { light: [item.color], dark: [item.color] },
    };
  }

  for (const [key, value] of Object.entries(config ?? {})) {
    const entry = evil[key] ?? (evil[key] = {});
    if (value.label !== undefined) {
      entry.label = value.label;
    }
    if ('color' in value && value.color) {
      entry.colors = { light: [value.color], dark: [value.color] };
    } else if ('theme' in value && value.theme) {
      entry.colors = { light: [value.theme.light], dark: [value.theme.dark] };
    }
  }

  return evil;
}

/**
 * Pie and radial slices are keyed by their category name. EvilCharts builds a
 * CSS variable (`--color-<key>-0`) from the key, and a CSS variable name cannot
 * contain spaces, so replace each category with a safe token and keep the real
 * name as the label. Returns the rewritten rows and the matching config.
 */
export function toEvilCategoryConfig(
  rows: Row[],
  nameKey: string,
  palette: string[],
  config: DashtroChartConfig | undefined,
): { data: Row[]; config: EvilChartConfig } {
  const evil: EvilChartConfig = {};

  const data = rows.map((row, index) => {
    const label = String(row[nameKey] ?? '');
    const key = `sector-${index}`;
    const color = palette[index % palette.length]!;
    const entry: EvilChartConfig[string] = {
      label: label === '' ? key : label,
      colors: { light: [color], dark: [color] },
    };

    const override = config?.[label];
    if (override) {
      if (override.label !== undefined) {
        entry.label = override.label;
      }
      if ('color' in override && override.color) {
        entry.colors = { light: [override.color], dark: [override.color] };
      } else if ('theme' in override && override.theme) {
        entry.colors = { light: [override.theme.light], dark: [override.theme.dark] };
      }
    }

    evil[key] = entry;
    return { ...row, [nameKey]: key };
  });

  return { data, config: evil };
}
