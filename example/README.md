# Dashtro example

A complete Astro + Dashtro app with two dashboards over real, public data:

- `/` — **What makes developers happy?** Uses the
  [Stack Exchange Developer Survey 2025](https://github.com/StackExchange/Survey)
  to rank what developers value in a job, how satisfied they are, and which
  languages, databases, frameworks, editors and AI models they use.
- `/simpsons` — **What made people stop watching The Simpsons?** Uses
  [The Simpsons by the Data](https://www.kaggle.com/datasets/prashant111/the-simpsons-dataset)
  to show the fall in US viewers and IMDb ratings over 27 seasons.

It shows:

- Server-rendered charts (`src/pages/index.astro`).
- An MDX dashboard page (`src/pages/simpsons.mdx`).
- A parameterised query reused with different values (`src/queries/tools.sql`).
- Client-side filters: a select on the survey group, and two number-range
  sliders on the episode chart.
- The query API endpoint (`/api/dashtro/query`).

## Run it

```bash
pnpm install
pnpm --filter dashtro-example seed   # downloads the data and writes data/analytics.duckdb
pnpm --filter dashtro-example dev
```

Open http://localhost:4321.

The seed script downloads the two sources, so it needs network access on the
first run. The `predev` and `prebuild` scripts rebuild the `dashtro` package
first, because the example imports the compiled output from `dist/`.

## Production build

```bash
pnpm --filter dashtro-example build
HOST=127.0.0.1 PORT=4321 node example/dist/server/entry.mjs
```

## Database

`scripts/seed.mjs` downloads both sources and writes two tables:

- `survey_answer` — one row per answer in a published survey distribution.
  Columns: `section`, `question`, `question_text`, `dataset`, `dataset_name`,
  `response`, `frequency`, `percent`, `rank`, `median`, `mode`, `total`.
- `simpsons_episodes` — one row per episode. Columns: `id`, `title`, `season`,
  `number_in_season`, `number_in_series`, `air_date`, `original_air_year`,
  `imdb_rating`, `imdb_votes`, `us_viewers_in_millions`, `views`.

The survey commit is pinned in `scripts/seed.mjs` so the example keeps working
if the upstream repository changes. The database file is not committed.
