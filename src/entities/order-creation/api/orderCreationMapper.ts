import type { OrderDraft, ValidatedCart } from '../model/types';

export type CartDto = {
  city_id: number;
  point_id?: number | null;
  valid?: boolean;
  items?: Array<{ item_id: number; name?: string; quantity: number; unit_price?: number; total?: number }>;
  subtotal?: number;
  discount?: number;
  total?: number;
  delivery?: { point_id: number; sum_div?: number; free_drive?: boolean; fee?: number } | null;
  errors?: Array<{ code?: string; text?: string; item_id?: number }>;
};

export type DraftDto = {
  id: number;
  chef_order_id?: number | null;
  status?: string;
  city_id: number;
  point_id: number;
  customer_id: number;
  type_order: number;
  cart: CartDto;
};

export function mapValidatedCart(value: CartDto): ValidatedCart {
  return {
    cityId: Number(value.city_id),
    pointId: value.point_id == null ? null : Number(value.point_id),
    valid: Boolean(value.valid),
    items: (value.items ?? []).map((item) => ({
      itemId: Number(item.item_id),
      name: String(item.name ?? ''),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price ?? 0),
      total: Number(item.total ?? 0),
    })),
    subtotal: Number(value.subtotal ?? 0),
    discount: Number(value.discount ?? 0),
    total: Number(value.total ?? 0),
    delivery: value.delivery === null || value.delivery === undefined ? null : {
      pointId: Number(value.delivery.point_id),
      sumDiv: Number(value.delivery.sum_div ?? 0),
      freeDrive: Boolean(value.delivery.free_drive),
      fee: Number(value.delivery.fee ?? 0),
    },
    errors: (value.errors ?? []).map((error) => ({
      code: String(error.code ?? 'CART_INVALID'),
      text: error.text,
      itemId: error.item_id == null ? undefined : Number(error.item_id),
    })),
  };
}

export function mapDraft(value: DraftDto): OrderDraft {
  return {
    id: Number(value.id),
    chefOrderId: value.chef_order_id == null ? null : Number(value.chef_order_id),
    status: String(value.status ?? 'draft'),
    cityId: Number(value.city_id),
    pointId: Number(value.point_id),
    customerId: Number(value.customer_id),
    typeOrder: Number(value.type_order),
    cart: mapValidatedCart(value.cart),
  };
}
