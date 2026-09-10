import { describe, expect, it } from 'vitest';
import { resolveOrderCreationCity } from './orderCreationQueries';

describe('resolveOrderCreationCity', () => {
  const cities = [
    { id: 1, name: 'Тольятти', slug: 'tolyatti' },
    { id: 2, name: 'Самара', slug: 'samara' },
  ];

  it('returns the named city', () => {
    expect(resolveOrderCreationCity(cities, 'Самара')?.id).toBe(2);
  });

  it('keeps the existing first-city fallback while data is available', () => {
    expect(resolveOrderCreationCity(cities, 'Неизвестный')?.id).toBe(1);
  });

  it('returns null before the city query resolves', () => {
    expect(resolveOrderCreationCity(undefined, 'Тольятти')).toBeNull();
  });
});
