# Dashtro v0.1.0 pre-launch checklist

Goal: publish a usable v0.1.0 that people can find, install, and try. Keep this list limited to launch work. Write all public-facing prose yourself.

## 1. Write the public text

- [ ] Rewrite the package `README.md` in your own words. Keep the install steps and code examples accurate.
- [ ] Rewrite `example/README.md` in your own words.
- [ ] Rewrite the docs home page: `docs/src/content/docs/index.mdx`.
- [ ] Rewrite `docs/src/content/docs/tutorials/first-dashboard.md`.
- [ ] Rewrite `docs/src/content/docs/tutorials/add-a-filter.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/add-chart-filters.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/build-and-deploy.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/connect-to-postgres.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/fetch-data-in-the-browser.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/style-charts.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/write-a-custom-chart.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/write-pages-in-mdx.md`.
- [ ] Rewrite `docs/src/content/docs/how-to/write-parameterised-queries.md`.
- [ ] Rewrite `docs/src/content/docs/explanation/client-vs-server-filtering.md`.
- [ ] Rewrite `docs/src/content/docs/explanation/data-loading-and-rendering.md`.
- [ ] Rewrite `docs/src/content/docs/explanation/how-it-works.md`.
- [ ] Rewrite `docs/src/content/docs/reference/chart-filters.md`.
- [ ] Rewrite `docs/src/content/docs/reference/charts.md`.
- [ ] Rewrite `docs/src/content/docs/reference/client.md`.
- [ ] Rewrite `docs/src/content/docs/reference/configuration.md`.
- [ ] Rewrite `docs/src/content/docs/reference/exports.md`.
- [ ] Rewrite `docs/src/content/docs/reference/query-api.md`.
- [ ] Rewrite `docs/src/content/docs/reference/query-object.md`.
- [ ] Rewrite `docs/src/content/docs/reference/sql-frontmatter.md`.
- [ ] Replace the package description in `package.json` with your own short description.
- [ ] Check each public text file for correct code, links, package names, and version details.

## 2. Make the project standalone

- [x] Choose whether to keep the monorepo history or start a clean history for the new repository.
I will start standalone repo in my local forgejo and mirror to github for now
- [x] Extract `apps/dashtro` to a standalone repository. Keep the example, docs, source, tests, and package files.
  The standalone repository is <https://forgejo.pm4.uk/peter/dashtro>, with a clean history.
- [x] Check that install, build, test, example, and docs commands work from the new repository root.
  `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, `pnpm build`, the example build, and the docs build all pass.
- [x] Update or remove monorepo-only paths and instructions, including `AGENTS.md` and the Forgejo link on the docs home page.
- [x] Add the new repository URL to `package.json` and update links in the README and docs.
- [x] Add an MIT `LICENSE` file. Confirm that vendored code has the right license and attribution.
  Added `LICENSE` and `THIRD-PARTY-NOTICES.md`. EvilCharts and shadcn/ui are MIT.
- [x] Check the extracted repo and package for private data, local database files, generated output, and links to the monorepo.
  No private data, no local databases and no generated output are tracked. The package holds `dist`, `assets`, `README.md`, `LICENSE`, `THIRD-PARTY-NOTICES.md` and `package.json`.

## 3. Check the v0.1.0 package

- [x] Confirm that `package.json` says `0.1.0` and that its package name and npm access are correct.
  The name is `dashtro`, the version is `0.1.0` and `publishConfig.access` is `public`.
- [x] Run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test`, and `pnpm build` from the standalone repo root.
- [x] Build the example and docs site. Fix any errors and broken links that block a new user.
  Both build. The docs build warns that the `site` option is unset; section 4 sets the public docs URL.
- [x] Check DuckDB and Postgres setup against the actual package. If Postgres is not ready for users, state that clearly in the docs.
  DuckDB works in the example and in the query API. Postgres works against a real server. The adapter now converts `int8` and `numeric` values to numbers. An opt-in integration test runs when `DASHTRO_TEST_POSTGRES_URL` is set.
- [x] Run `npm pack --dry-run` and check that the package has the required build files, README, and license, and no unwanted files.
  169 files: `dist`, `assets`, `README.md`, `LICENSE`, `THIRD-PARTY-NOTICES.md` and `package.json`.
- [x] Install the package tarball in a clean Astro app and complete the quick-start steps. Do not rely only on the example's workspace link.
  A clean Astro 7 app with `@astrojs/react` 7, DuckDB and Tailwind 4 installs from the tarball. The page renders and the query API works. The `@astrojs/react` peer range now also accepts v7.

## 4. Publish

- [ ] Set up a public docs URL and verify that its links work outside the repository.
- [ ] Create a GitHub release for `v0.1.0` from the tested commit. Make the Git tag match `package.json`.
- [ ] Publish `dashtro@0.1.0` to npm and check that a clean app can install it.
- [ ] Write and post your own launch note with the GitHub, docs, and npm links.
