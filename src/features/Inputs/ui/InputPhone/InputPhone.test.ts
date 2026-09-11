import { describe, expect, it } from 'vitest';
import { normalizePhoneDigits } from './InputPhone';

describe('normalizePhoneDigits', () => {
  it.each([
    ['+7 921 346-30-70', '9213463070'],
    ['7 (921) 346-30-70', '9213463070'],
    ['8 (921) 346-30-70', '9213463070'],
    ['921 346-30-70', '9213463070'],
  ])('normalizes a pasted Russian phone with %s', (input, expected) => {
    expect(normalizePhoneDigits(input)).toBe(expected);
  });

  it('does not drop the last digit of an already local number', () => {
    expect(normalizePhoneDigits('9213463070')).toBe('9213463070');
  });

  it('limits accidental extra input after normalization', () => {
    expect(normalizePhoneDigits('+7 921 346-30-701')).toBe('9213463070');
  });
});
