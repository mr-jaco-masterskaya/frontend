import { apiRequest } from '@/shared/api/http';
import { mapDraft, mapValidatedCart } from './orderCreationMapper';
import type { OrderDraftInput, OrderCreationContext, OrderCreationLine, OrderDraft, ValidatedCart } from '../model/types';
import type { CartDto, DraftDto } from './orderCreationMapper';

const lines = (items: OrderCreationLine[]) => items.map((item) => ({
  item_id: item.itemId,
  quantity: item.quantity,
  ...(item.modifiers ? { modifiers: item.modifiers.map((modifier) => ({ item_id: modifier.itemId, quantity: modifier.quantity })) } : {}),
}));

const context = (value: OrderCreationContext) => ({
  city_id: value.cityId,
  ...(value.pointId === undefined ? {} : { point_id: value.pointId }),
  ...(value.typeOrder === undefined ? {} : { type_order: value.typeOrder }),
  ...(value.streetId === undefined ? {} : { street_id: value.streetId }),
  ...(value.promoCode ? { promo_code: value.promoCode } : {}),
  ...(value.customerId === undefined ? {} : { customer_id: value.customerId }),
  ...(value.phone ? { phone: value.phone } : {}),
});

export const orderCreationApi = {
  async validateCart(input: OrderCreationContext & { items: OrderCreationLine[] }): Promise<ValidatedCart> {
    const response = await apiRequest<{ data: CartDto }>('/cart/validate', { method: 'POST', body: { ...context(input), items: lines(input.items) } });
    return mapValidatedCart(response.data);
  },

  async replaceCart(input: OrderCreationContext & { items: OrderCreationLine[] }): Promise<ValidatedCart> {
    const response = await apiRequest<{ data: CartDto }>('/cart', { method: 'PUT', body: { ...context(input), items: lines(input.items) } });
    return mapValidatedCart(response.data);
  },

  async clearCart(): Promise<void> {
    await apiRequest('/cart', { method: 'DELETE' });
  },

  async createDraft(input: OrderDraftInput): Promise<OrderDraft> {
    const response = await apiRequest<{ data: DraftDto }>('/orders/draft', { method: 'POST', body: {
      city_id: input.cityId,
      point_id: input.pointId,
      customer_id: input.customerId,
      type_order: input.typeOrder,
      ...(input.addressId === undefined ? {} : { address_id: input.addressId }),
      ...(input.promoCode ? { promo_code: input.promoCode } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.comment ? { comment: input.comment } : {}),
      ...(input.preorderAt ? { preorder_at: input.preorderAt } : {}),
      ...(input.paymentType === undefined ? {} : { payment_type: input.paymentType }),
      ...(input.sdacha === undefined ? {} : { sdacha: input.sdacha }),
    } });
    return mapDraft(response.data);
  },

  async validateDraft(draftId: number): Promise<{ valid: boolean; order: OrderDraft }> {
    const response = await apiRequest<{ data: { valid?: boolean; order: DraftDto } }>(`/orders/${draftId}/validation`);
    return { valid: Boolean(response.data.valid), order: mapDraft(response.data.order) };
  },

  async confirmDraft(draftId: number, idempotencyKey: string): Promise<OrderDraft> {
    const response = await apiRequest<{ data: DraftDto }>(`/orders/${draftId}/confirm`, { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } });
    return mapDraft(response.data);
  },

  async cancelDraft(draftId: number): Promise<OrderDraft> {
    const response = await apiRequest<{ data: DraftDto }>(`/orders/${draftId}/cancel`, { method: 'POST', body: {} });
    return mapDraft(response.data);
  },
};
