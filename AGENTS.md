# Dashtro — agent notes

`dashtro` is an Astro integration plus a small component library. It turns `.sql`
files and Markdown/Astro pages into dashboards. This is the standalone Dashtro
repository. All commands run from the repository root unless a section says
otherwise.

See `README.md` for the user-facing documentation. This file is for working on
the package itself.

## Layout

- `src/index.ts` — the `dashtro` package entry. It is loaded by Node when Astro
  reads `astro.config.mjs`, so it must **not** statically import `.astro` files,
  React components, or `virtual:*` modules. Only the integration and plain
  server-safe modules belong here.
- `src/react/` — the chart components (`dashtro/react`). Charts are
  presentational React components: the page runs the query, passes `data`, and
  adds the `client:*` directive. They never fetch.
  - `charts/*.tsx` — one thin component per chart type. Each adapts Dashtro's
    `data`/`x`/`series` props to the EvilCharts compound API.
  - `evilcharts/` — the vendored EvilCharts registry (MIT). Do not edit by hand;
    see `evilcharts/README.md` for the small local patches.
  - `evil-config.ts` — maps Dashtro colours/labels to the EvilCharts config.
  - `frame.tsx` — the shared Card header / loading / empty state.
  - `filters.ts`, `filter-controls.tsx` — chart-side filters. `filters.ts` is
    pure (no React) and unit-tested; `filter-controls.tsx` owns the state and
    renders the built-in controls, including the range slider.
  - `slider.tsx` — vendored shadcn/ui slider, built on `@base-ui/react`.
  - `series.ts`, `format.ts` — small leaf helpers.
  - `scripts/bundle-react.mjs` bundles this entry point, including Recharts,
    into `dist/react/index.js`. Only `react` and `react-dom` stay external.
- `src/runtime/` — SQL parsing, parameter binding, database adapters, and the
  query registry. Contains no Astro or React imports, so it is unit-testable.
- `src/routes/query.ts` — the `POST/GET /api/dashtro/query` endpoint.
- `src/vite-plugin.ts` — transforms `.sql` imports and defines
  `virtual:dashtro/config` and `virtual:dashtro/queries`.
- `example/` — a working Astro app with two dashboards over real data.
- `docs/` — the documentation site (Starlight + `starlight-theme-black`),
  organised with the Diátaxis structure. It renders live charts from
  `dashtro/react` on the Examples page, so `dashtro` must be built first (the
  docs `predev`/`prebuild` scripts do this). The chart Tailwind setup is scoped
  to `.dashtro-example` in `docs/src/styles/charts.css`.

## Commands

```bash
pnpm install
pnpm build        # rm -rf dist && tsc && bundle React && copy .astro + styles.css
pnpm test         # vitest
pnpm typecheck    # tsc --noEmit
```

The Postgres integration tests are skipped unless a scratch database is set:

```bash
DASHTRO_TEST_POSTGRES_URL=postgres://postgres@127.0.0.1:5432/dashtro_test pnpm test
```

The example app depends on the built `dist/`, so always `pnpm build` before
running the example.

```bash
pnpm --filter dashtro-example seed
pnpm --filter dashtro-example dev
pnpm --filter dashtro-example build
```

The docs site is a separate workspace package:

```bash
pnpm --filter dashtro-docs dev
pnpm --filter dashtro-docs build
```

The docs render live charts, so `pnpm --filter dashtro-docs build` builds the
`dashtro` package first through its `prebuild` script.

## Adding a chart type

1. Add `src/react/charts/<Name>.tsx`. Check first whether an EvilCharts chart
   already fits; otherwise compose one. Reuse `normalizeSeries`,
   `toEvilConfig` and `ChartFrame`. Feed the EvilCharts parts from `series`, and
   accept `children` as an escape hatch.
2. Re-export the component and its props type from `src/react/index.ts`.

There is no central registry, no `switch` on a chart type, and no Astro wrapper
to keep in sync. Charts do not load data; the caller runs `sql.run()`.

## Rules of thumb

- Keep the package a single package. No sub-packages.
- `src/runtime/` must stay free of `astro`, `react` and `virtual:*` imports.
- Keep `react` and `react-dom` external in the React bundle. Recharts (and its
  dependency tree, including `react-redux` and `use-sync-external-store`) and
  `@base-ui/react` (for the vendored slider) must be inlined, otherwise a
  locally linked copy of dashtro loads a second React and React reports an
  invalid hook call.
- The integration sets `ssr.noExternal: ['dashtro']` so Vite resolves dashtro's
  React imports through `resolve.dedupe`. Keep it.
- Front matter is parsed in the Vite transform, so the transform must pass the
  parsed `params` to `createQuery`; the SQL body it passes has no front matter.
- Client components receive JSON-serialisable props only. Never pass functions
  across the server/client boundary.
- `src/styles.css` ships `@source` rules plus default theme tokens. Every default
  is a `var(--token, fallback)`, so an app's own shadcn theme always wins.
  Tailwind v4 is required.
- The `virtual:dashtro/config` module contains the database URL (possibly with a
  password). Never import it from client code.
- DuckDB returns `BIGINT` as `bigint`. The adapter normalises bigints so
  `JSON.stringify` and chart inference keep working.
