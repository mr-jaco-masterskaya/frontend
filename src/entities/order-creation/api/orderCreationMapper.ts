import type { OrderDraft, ValidatedCart, ValidatedCartItem, ValidatedCartModifier, ValidatedPromo } from '../model/types';

type ModifierDto = { item_id: number; name?: string; quantity: number; unit_price?: number; total?: number; billable?: boolean };
type CartItemDto = { item_id: number; name?: string; quantity: number; unit_price?: number; total?: number; modifiers?: ModifierDto[]; modifier_total?: number; fixed_price?: boolean; promo_addition?: boolean };
type PromoDto = { id?: number; code?: string; name?: string; text?: string; condition_text?: string; free_drive?: boolean; effect?: { additions?: CartItemDto[] } };

export type CartDto = {
  city_id: number;
  point_id?: number | null;
  valid?: boolean;
  items?: CartItemDto[];
  subtotal?: number;
  discount?: number;
  total?: number;
  delivery?: { point_id: number; sum_div?: number; free_drive?: boolean; fee?: number } | null;
  errors?: Array<{ code?: string; text?: string; item_id?: number }>;
  promo?: PromoDto | null;
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

function mapModifier(value: ModifierDto): ValidatedCartModifier {
  return { itemId: Number(value.item_id), name: String(value.name ?? ''), quantity: Number(value.quantity), unitPrice: Number(value.unit_price ?? 0), total: Number(value.total ?? 0), billable: Boolean(value.billable) };
}

function mapCartItem(value: CartItemDto): ValidatedCartItem {
  return { itemId: Number(value.item_id), name: String(value.name ?? ''), quantity: Number(value.quantity), unitPrice: Number(value.unit_price ?? 0), total: Number(value.total ?? 0), modifiers: (value.modifiers ?? []).map(mapModifier), modifierTotal: Number(value.modifier_total ?? 0), fixedPrice: Boolean(value.fixed_price), promoAddition: Boolean(value.promo_addition) };
}

function mapPromo(value: PromoDto | null | undefined): ValidatedPromo | null {
  if (!value) return null;
  return { id: Number(value.id ?? 0), code: String(value.code ?? ''), name: String(value.name ?? ''), text: String(value.text ?? ''), conditionText: String(value.condition_text ?? ''), freeDrive: Boolean(value.free_drive), additions: (value.effect?.additions ?? []).map(mapCartItem) };
}

export function mapValidatedCart(value: CartDto): ValidatedCart {
  return {
    cityId: Number(value.city_id),
    pointId: value.point_id == null ? null : Number(value.point_id),
    valid: Boolean(value.valid),
    items: (value.items ?? []).map(mapCartItem),
    subtotal: Number(value.subtotal ?? 0),
    discount: Number(value.discount ?? 0),
    total: Number(value.total ?? 0),
    promo: mapPromo(value.promo),
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
