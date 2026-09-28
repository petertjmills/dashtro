---
title: Style charts
description: Set up Tailwind, theme the chart colours, and format values.
sidebar:
  order: 7
---

Dashtro's charts are shadcn/ui charts. They use Tailwind classes and the shadcn
colour names (`--card`, `--muted-foreground`, `--chart-1` ... `--chart-5`).

## Required setup

Tailwind v4 is required. Install it, add the Vite plugin, and import the two
stylesheets once in your layout:

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

```js
// astro.config.mjs
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  vite: { plugins: [tailwindcss()] },
  // ...
});
```

```css
/* src/styles/global.css */
@import "tailwindcss";
@import "dashtro/styles.css";
```

`dashtro/styles.css` adds the `@source` rules that let Tailwind scan Dashtro's
components, and provides default values for every token. Every default is a
fallback, so your own theme wins.

## Override the theme

Define the variables in `:root` to match an existing shadcn theme:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --border: oklch(0.922 0 0);
  --chart-1: #3245ff;
  --chart-2: #b845ed;
  --chart-3: #ed254e;
  --chart-4: #f9dc5c;
  --chart-5: #c2eabd;
  --radius: 0.625rem;
}
```

## Set series colours

Pass `colors` to override the palette for one chart:

```astro
<BarChart colors={['#0f766e', '#f59e0b']} ... />
```

Or set a colour on one series:

```astro
<BarChart series={[{ key: 'revenue', label: 'Revenue', color: '#0f766e' }]} ... />
```

## Format numbers

Use the `valueFormat` prop. It is JSON-serialisable, so it survives the
server-to-client boundary.

```astro
<BarChart
  valueFormat={{ style: 'currency', currency: 'GBP', maximumFractionDigits: 2 }}
  ...
/>
```

Styles are `decimal`, `currency` and `percent`.

## Adjust the card

- `title` and `description` render a shadcn Card header.
- `className` styles the Card, `chartClassName` styles the plot.
- `bare` removes the Card wrapper and renders only the chart.
- `height` sets the plot height in pixels.

## Related

- [Charts reference](/reference/charts/)
- [Write a custom chart](/how-to/write-a-custom-chart/)
