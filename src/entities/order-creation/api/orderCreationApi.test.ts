import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL } from '@/shared/config/api';
import { orderCreationApi } from './orderCreationApi';
import { OrderCreationWorkflowError, submitOrder } from './orderCreationWorkflow';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('orderCreationApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('validates the cart with the server-side pricing contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ st: true, data: {
      city_id: 7, point_id: 4, valid: true, items: [{ item_id: 12, name: 'Сет', quantity: 2, unit_price: 900, total: 1800 }], subtotal: 1800, discount: 100, total: 1700, delivery: null, errors: [],
    } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(orderCreationApi.validateCart({ cityId: 7, pointId: 4, typeOrder: 1, promoCode: 'TEST', items: [{ itemId: 12, quantity: 2 }] })).resolves.toMatchObject({ valid: true, total: 1700 });
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/cart/validate`);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ city_id: 7, point_id: 4, type_order: 1, promo_code: 'TEST', items: [{ item_id: 12, quantity: 2 }] });
  });

  it('creates and confirms a draft with an idempotency key', async () => {
    const draft = { id: 44, status: 'draft', city_id: 7, point_id: 4, customer_id: 9, type_order: 1, cart: { city_id: 7, point_id: 4, valid: true, items: [], subtotal: 0, discount: 0, total: 0, delivery: null, errors: [] } };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ st: true, data: draft }, 201))
      .mockResolvedValueOnce(json({ st: true, data: { ...draft, status: 'confirmed' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(orderCreationApi.createDraft({ cityId: 7, pointId: 4, customerId: 9, typeOrder: 1, comment: 'Позвонить за час', paymentType: 1, sdacha: 5000 })).resolves.toMatchObject({ id: 44, status: 'draft' });
    await expect(orderCreationApi.confirmDraft(44, 'idempotency-44')).resolves.toMatchObject({ id: 44, status: 'confirmed' });
    expect((fetchMock.mock.calls[1][1].headers as Headers).get('Idempotency-Key')).toBe('idempotency-44');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ comment: 'Позвонить за час', payment_type: 1, sdacha: 5000 });
  });

  it('runs cart replacement, draft validation, and confirmation in order', async () => {
    const cart = { city_id: 7, point_id: 4, valid: true, items: [{ item_id: 12, name: 'Сет', quantity: 1, unit_price: 900, total: 900 }], subtotal: 900, discount: 0, total: 900, delivery: null, errors: [] };
    const draft = { id: 45, status: 'draft', city_id: 7, point_id: 4, customer_id: 9, type_order: 1, cart };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ st: true, data: cart }))
      .mockResolvedValueOnce(json({ st: true, data: draft }, 201))
      .mockResolvedValueOnce(json({ st: true, data: { valid: true, order: draft } }))
      .mockResolvedValueOnce(json({ st: true, data: { ...draft, status: 'confirmed' } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(submitOrder({ cityId: 7, pointId: 4, customerId: 9, typeOrder: 1, items: [{ itemId: 12, quantity: 1 }], idempotencyKey: 'order-45' })).resolves.toMatchObject({ status: 'confirmed' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${API_BASE_URL}/cart`,
      `${API_BASE_URL}/orders/draft`,
      `${API_BASE_URL}/orders/45/validation`,
      `${API_BASE_URL}/orders/45/confirm`,
    ]);
  });

  it('does not create a draft when the server rejects the cart', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ st: true, data: { city_id: 7, point_id: 4, valid: false, items: [], total: 0, errors: [{ code: 'ITEM_STOPPED', text: 'Позиция недоступна' }] } }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(submitOrder({ cityId: 7, pointId: 4, customerId: 9, typeOrder: 1, items: [{ itemId: 12, quantity: 1 }] })).rejects.toMatchObject({ code: 'CART_INVALID' } satisfies Partial<OrderCreationWorkflowError>);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
