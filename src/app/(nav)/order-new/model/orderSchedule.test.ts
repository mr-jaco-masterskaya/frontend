import { describe, expect, it } from 'vitest';
import { toPreorderAt } from './orderSchedule';

describe('toPreorderAt', () => {
  it('maps the start of a saved delivery interval to the API format', () => {
    expect(toPreorderAt('09.09.2026', '14:30 - 15:00')).toBe('2026-09-09 14:30');
  });

  it('rejects incomplete operator input', () => {
    expect(toPreorderAt('09.09.2026', '14:30')).toBeNull();
    expect(toPreorderAt('', '14:30 - 15:00')).toBeNull();
  });

  it('rejects impossible calendar dates', () => {
    expect(toPreorderAt('31.02.2026', '14:30 - 15:00')).toBeNull();
  });

  it('trims input copied from the date and time controls', () => {
    expect(toPreorderAt(' 09.09.2026 ', ' 14:30 - 15:00 ')).toBe('2026-09-09 14:30');
  });
});
