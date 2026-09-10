import { describe, expect, it } from 'vitest';
import { validateDeliveryDetails } from './orderDelivery';

const valid = {
  address: 'Чапаева 47',
  addressCheckStatus: 'success' as const,
  entrance: '1',
  floor: '2',
  apartment: '17',
};

describe('delivery details validation', () => {
  it('accepts a checked address and required delivery details', () => {
    expect(validateDeliveryDetails(valid)).toEqual({ valid: true });
  });

  it('does not require a building/corpus value', () => {
    expect(validateDeliveryDetails(valid)).toEqual({ valid: true });
  });

  it.each([
    ['address', { ...valid, address: '' }, 'Укажите улицу и дом'],
    ['address check', { ...valid, addressCheckStatus: null }, 'Проверьте адрес кнопкой «Найти»'],
    ['entrance', { ...valid, entrance: ' ' }, 'Укажите подъезд'],
    ['floor', { ...valid, floor: '' }, 'Укажите этаж'],
    ['apartment', { ...valid, apartment: '' }, 'Укажите квартиру'],
  ])('rejects missing %s', (_name, input, message) => {
    expect(validateDeliveryDetails(input)).toMatchObject({ valid: false, message });
  });
});
