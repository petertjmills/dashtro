import { describe, expect, it } from 'vitest';

import { MAX_AXIS_WIDTH, axisWidth, truncateLabel } from '../src/react/series.js';

describe('axisWidth', () => {
  it('grows with the longest label', () => {
    expect(axisWidth(['SQL'])).toBe(16 + 3 * 7);
    expect(axisWidth(['SQL', 'JavaScript'])).toBe(16 + 10 * 7);
  });

  it('caps the width so the plot keeps room', () => {
    const long = 'a'.repeat(200);
    expect(axisWidth([long])).toBe(MAX_AXIS_WIDTH);
  });
});

describe('truncateLabel', () => {
  it('keeps short labels unchanged', () => {
    expect(truncateLabel('React', 100)).toBe('React');
  });

  it('shortens long labels to fit the width', () => {
    const width = 16 + 10 * 7;
    const result = truncateLabel('Innovation through solving complex problems', width);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
