import { describe, expect, it } from 'vitest';
import { normalizeHome, splitStreetAndHome } from './orderAddress';

describe('order address parser', () => {
  it.each([
    ['Чапаева 47', { street: 'Чапаева', home: '47' }],
    ['Чапаева, 47', { street: 'Чапаева', home: '47' }],
    ['Ленина 12а', { street: 'Ленина', home: '12а' }],
    ['Мира 10/2', { street: 'Мира', home: '10/2' }],
  ])('parses %s', (input, expected) => {
    expect(splitStreetAndHome(input)).toEqual(expected);
  });

  it.each(['Чапаева', 'Чапаева дом', '', '47'])('rejects incomplete input %s', (input) => {
    expect(splitStreetAndHome(input)).toBeNull();
  });

  it('normalizes house casing and whitespace for matching', () => {
    expect(normalizeHome(' 12 А ')).toBe('12а');
    expect(normalizeHome('10 / 2')).toBe('10/2');
  });
});
