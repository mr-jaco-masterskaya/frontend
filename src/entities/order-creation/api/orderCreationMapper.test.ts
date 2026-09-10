import { describe, expect, it } from 'vitest';
import { mapDraft, mapValidatedCart } from './orderCreationMapper';

const cart = {
  city_id: 7,
  point_id: 4,
  valid: true,
  items: [],
  subtotal: 0,
  discount: 0,
  total: 0,
  delivery: null,
  errors: [],
};

describe('order creation draft mapper', () => {
  it('preserves validated modifiers and promotion additions', () => {
    const mapped = mapValidatedCart({
      city_id: 7,
      point_id: 4,
      valid: true,
      items: [{
        item_id: 12,
        name: 'Сет',
        quantity: 2,
        unit_price: 900,
        total: 1900,
        modifier_total: 100,
        fixed_price: true,
        modifiers: [{ item_id: 51, name: 'Соус', quantity: 1, unit_price: 50, total: 50, billable: true }],
      }],
      subtotal: 1900,
      discount: 200,
      total: 1700,
      delivery: null,
      promo: { id: 9, code: 'SET', name: 'Акция', text: 'Подарок', free_drive: true, effect: { additions: [{ item_id: 99, name: 'Подарок', quantity: 1, unit_price: 0, total: 0, promo_addition: true }] } },
      errors: [],
    });

    expect(mapped.items[0]).toMatchObject({ modifierTotal: 100, fixedPrice: true });
    expect(mapped.items[0].modifiers[0]).toMatchObject({ itemId: 51, billable: true });
    expect(mapped.promo).toMatchObject({ id: 9, code: 'SET', freeDrive: true });
    expect(mapped.promo?.additions[0]).toMatchObject({ itemId: 99, promoAddition: true });
  });

  it('preserves the Chef order identifier returned after confirmation', () => {
    expect(mapDraft({ id: 44, chef_order_id: 801234, status: 'confirmed', city_id: 7, point_id: 4, customer_id: 9, type_order: 1, cart })).toMatchObject({
      id: 44,
      chefOrderId: 801234,
      status: 'confirmed',
    });
  });

  it('keeps drafts compatible when the Chef identifier is absent', () => {
    expect(mapDraft({ id: 44, status: 'draft', city_id: 7, point_id: 4, customer_id: 9, type_order: 1, cart }).chefOrderId).toBeNull();
  });
});
