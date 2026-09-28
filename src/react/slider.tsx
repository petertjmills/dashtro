import { Slider as SliderPrimitive } from '@base-ui/react/slider';

import { cn } from './utils.js';

// Adapted from the shadcn/ui slider component (base-nova), with two changes:
//
// 1. The import path for `cn`.
// 2. The orientation classes use `data-[orientation=horizontal]:` instead of
//    shadcn's `data-horizontal:`. shadcn defines `data-horizontal` as a custom
//    Tailwind variant in its own setup. dashtro does not, so Tailwind generated
//    a `[data-horizontal]` selector that never matched (Base UI sets
//    `data-orientation`). That left the track and the active range with no
//    height. The bracket form needs no custom variant.
//
// It also accepts per-thumb `aria-label`s, since dashtro renders range sliders
// inside a card with no visible per-thumb label.
export interface SliderProps extends SliderPrimitive.Root.Props {
  /** Accessible name for each thumb, in the same order as the values. */
  thumbLabels?: string[];
}

function Slider({ className, defaultValue, value, min = 0, max = 100, thumbLabels, ...props }: SliderProps) {
  const values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn('data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full', className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            aria-label={thumbLabels?.[index]}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
