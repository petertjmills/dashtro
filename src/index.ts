export { default, default as dashtro, type DashtroOptions } from './integration.js';

export { runQuery, DashtroRequestError, type RunQueryOptions } from './client/index.js';

export {
  createQuery,
  findParams,
  parseDatabaseUrl,
  parseSqlSource,
} from './runtime/index.js';

export type {
  Database,
  DashtroQuery,
  DashtroResolvedConfig,
  Dialect,
  ParamDefinition,
  ParamType,
  QueryDefinition,
  Row,
} from './runtime/types.js';

// Type-only re-exports. `dashtro/react` holds the runtime chart components and
// `dashtro/charts` holds the Astro components. They are kept out of this entry
// so that `astro.config.mjs` can import `dashtro` without loading `.astro` or
// React code through Node.
export type {
  ChartConfig,
  ChartDisplayProps,
  ChartKind,
  ChartLayoutProps,
  ChartSeriesProps,
  ChartSourceProps,
  DashtroSeries,
  SeriesInput,
  ValueFormat,
} from './react/index.js';
