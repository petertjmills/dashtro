# Vendored EvilCharts components

These files are copied from [EvilCharts](https://evilcharts.com), a shadcn-style
registry of chart components.

- Source: https://github.com/legions-developer/evilcharts
- Registry: https://evilcharts.com/r/registry.json
- License: MIT, Copyright (c) 2026 Gurbinder

They are vendored instead of installed because EvilCharts is a copy-paste
registry, not a package. The changes are:

1. The leading `"use client"` directive is removed (Astro is not Next.js).
2. `@/lib/utils` imports point at `../utils.js`.
3. `@/registry/ui/*` imports point at the sibling files in this directory.
4. Two type-only imports use `import type` (`RectRadius`, `TypedDataKey`) to
   satisfy `verbatimModuleSyntax`.
5. `recharts-bar-chart.tsx` renders bars with a negative value. Recharts passes
   a negative `height` for values below the baseline, and the original
   `Math.max(0, height - 3)` collapsed them to zero. The shape now lifts the bar
   to the baseline and uses the absolute height. Report upstream if fixed.

Do not edit these files by hand beyond the points above. Re-vendor them if you
need an update. The Dashtro chart components in `../charts/` adapt Dashtro's
props to the compound API these files expose.
