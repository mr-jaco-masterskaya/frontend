import { describe, expect, it } from 'vitest';
import { mapDraft } from './orderCreationMapper';

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
