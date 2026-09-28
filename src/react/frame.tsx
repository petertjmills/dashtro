import * as React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card.js';

export interface ChartFrameProps {
  title?: string;
  description?: string;
  /** Render the empty state instead of the chart. */
  empty?: boolean;
  /** Filter controls rendered above the plot. They stay visible when the plot is empty. */
  controls?: React.ReactNode;
  height?: number;
  bare?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The only shared layout piece: a shadcn Card with an optional header and an
 * empty state. It knows nothing about chart types or data loading.
 */
export function ChartFrame({
  title,
  description,
  empty,
  controls,
  height = 320,
  bare,
  className,
  children,
}: ChartFrameProps) {
  const body = (
    <div className="flex flex-col gap-4">
      {controls ? <div className="w-full">{controls}</div> : null}
      <div className="relative w-full">
        {empty ? (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height }}
          >
            No data
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (bare) {
    return <div className={className}>{body}</div>;
  }

  return (
    <Card className={className}>
      {title || description ? (
        <CardHeader>
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}
      <CardContent>{body}</CardContent>
    </Card>
  );
}
