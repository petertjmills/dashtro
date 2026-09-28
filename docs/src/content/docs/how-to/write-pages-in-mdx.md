---
title: Write pages in MDX
description: Use the same components and queries from an MDX page.
sidebar:
  order: 6
---

An MDX page can import queries and chart components. Run the queries in the
module, then pass the rows to the charts.

```mdx
---
layout: ../layouts/Layout.astro
title: Models
description: Spend by model.
---

import { BarChart, PieChart } from 'dashtro/react';
import modelUsage from '../queries/model-usage.sql';
import totalUsage from '../queries/total-usage.sql';

export const models = await modelUsage.run();
export const total = await totalUsage.run();

Write prose between the charts. The queries run once, on the server.

<BarChart
  client:load
  data={models}
  x="model"
  series={[{ key: 'spend', label: 'Spend' }]}
  title="Spend by model"
  valueFormat={{ style: 'currency', currency: 'GBP' }}
  height={320}
/>

<PieChart
  client:load
  data={total}
  x="model"
  series={[{ key: 'requests', label: 'Requests' }]}
  title="Request share"
  height={320}
/>
```

## Notes

- Add the `client:*` directive to each chart, the same as in an `.astro` page.
- `export const` runs at module scope, on the server. Do not put a fetch in the
  body.
- The layout front matter is passed to the layout under the `frontmatter` prop.
  Read it with `Astro.props.frontmatter.title` in the layout.

## Related

- [Build your first dashboard](/tutorials/first-dashboard/)
- [Charts reference](/reference/charts/)
