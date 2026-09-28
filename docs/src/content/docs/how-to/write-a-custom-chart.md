---
title: Write a custom chart
description: Build a chart that Dashtro does not ship, using the exported EvilCharts parts.
sidebar:
  order: 5
---

Dashtro builds its charts on the vendored [EvilCharts](https://evilcharts.com)
registry and re-exports it. To build a chart Dashtro does not ship, compose an
`Evil*Chart` root with its parts.

```tsx
// src/components/GoalBarChart.tsx
import { EvilBarChart, type EvilChartConfig } from 'dashtro/react';
import { ReferenceLine } from 'recharts';

type Row = { month: string; actual: number };

const config = {
  actual: {
    label: 'Actual',
    colors: { light: ['#f97316'], dark: ['#fb923c'] },
  },
} satisfies EvilChartConfig;

export function GoalBarChart({ data, goal }: { data: Row[]; goal: number }) {
  return (
    <div className="h-80 w-full">
      <EvilBarChart data={data} config={config} xDataKey="month" className="h-full w-full">
        <EvilBarChart.Grid />
        <EvilBarChart.XAxis dataKey="month" />
        <EvilBarChart.YAxis />
        <EvilBarChart.Tooltip />
        <ReferenceLine y={goal} stroke="var(--chart-2)" strokeDasharray="4 4" />
        <EvilBarChart.Bar dataKey="actual" />
      </EvilBarChart>
    </div>
  );
}
```

Render it like any other client island:

```astro
---
import { GoalBarChart } from '../components/GoalBarChart';
import goals from '../queries/goals.sql';

const data = await goals.run();
---

<GoalBarChart client:load data={data} goal={5000} />
```

## What is exported

| Export | Purpose |
| --- | --- |
| `EvilAreaChart`, `EvilLineChart`, `EvilBarChart`, `EvilPieChart`, `EvilRadarChart`, `EvilRadialChart` | The chart roots. Each carries its parts (`.Grid`, `.XAxis`, `.YAxis`, `.Tooltip`, `.Legend`, ...). |
| `ChartContainer`, `ChartStyle`, `useChart` | The base container, for a chart built from raw Recharts marks. |
| `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`, `ChartLegendContent` | The tooltip and legend parts. |
| `EvilChartConfig` | The EvilCharts config type. |
| `toEvilConfig`, `toEvilCategoryConfig` | Map Dashtro's series and colours to the EvilCharts config. |
| `ChartFrame` | The Card, title, description and empty state. |

## Notes

- Keep data loading outside the component. Run `sql.run()` in the page and pass
  `data`.
- The `config` prop must be JSON-serialisable, because charts are Astro islands.
- The chart root needs a sized parent. Give the wrapper a height and pass
  `className="h-full w-full"` to the root.
- Any Recharts child works inside an `Evil*Chart` root. That is how the
  `ReferenceLine` above is added.
- The full component API is in the [EvilCharts docs](https://evilcharts.com/docs).

## Related

- [Charts reference](/reference/charts/)
- [Style charts](/how-to/style-charts/)
