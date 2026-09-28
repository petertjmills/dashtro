# Dashtro docs

The Dashtro documentation site. It uses
[Astro Starlight](https://starlight.astro.build) with
[starlight-theme-black](https://github.com/adrian-ub/starlight-theme-black).

The content follows the [Diátaxis](https://diataxis.fr/) structure:

- `tutorials/` — learning-oriented. Build something from scratch.
- `how-to/` — problem-oriented. Solve one specific task.
- `reference/` — information-oriented. The exact API.
- `explanation/` — understanding-oriented. Why Dashtro works this way.

The site renders **live charts** from `dashtro/react` with static data. It does
not need a database. `src/content/docs/examples.mdx` is the gallery;
`src/styles/charts.css` holds the Tailwind setup for the charts.

## Run it

From the repository root:

```bash
pnpm install
pnpm --filter dashtro-docs dev      # http://localhost:4321
pnpm --filter dashtro-docs build
pnpm --filter dashtro-docs preview
```

The `predev` and `prebuild` scripts build the `dashtro` package first, because
the docs import the compiled chart bundle from `dist/`.

## Live charts

The docs run Tailwind and React islands alongside Starlight. Two rules keep the
site theme intact:

1. `charts.css` imports only `tailwindcss/theme.css` and
   `tailwindcss/utilities.css`. It skips the preflight, which would reset
   Starlight's headings and lists.
2. Every chart token is scoped to `.dashtro-example`. Wrap a chart in
   `<div class="not-content dashtro-example">` so the tokens apply and
   Starlight's prose styles stay out.

## Add a page

Create a Markdown or MDX file under `src/content/docs/<section>/`. The sidebar
picks it up automatically. Use `sidebar.order` in the front matter to set the
position within its section, and add cross-links in the "Related" section at the
bottom.
