# Third-party notices

Dashtro includes code from other projects. This file lists the source and the
license of each part.

## EvilCharts

Files: `src/react/evilcharts/`

Source: <https://github.com/legions-developer/evilcharts>

License: MIT, Copyright (c) 2026 Gurbinder.

The local changes are listed in `src/react/evilcharts/README.md`.

## shadcn/ui

Files: `src/react/card.tsx`, `src/react/slider.tsx`

Source: <https://github.com/shadcn-ui/ui>

License: MIT.

`card.tsx` is adapted from the shadcn/ui card component. `slider.tsx` is adapted
from the shadcn/ui slider component (base-nova), which uses `@base-ui/react`.

## Bundled npm dependencies

`scripts/bundle-react.mjs` inlines the runtime dependencies of the chart layer
(for example Recharts, `@base-ui/react` and Motion) into `dist/react/index.js`.
esbuild collects the license comments of these packages at the end of the
bundle. The full dependency list and the licenses are in `pnpm-lock.yaml` and in
the packages themselves.
