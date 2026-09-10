export type OrderCreationLine = {
  itemId: number;
  quantity: number;
  modifiers?: Array<{ itemId: number; quantity: number }>;
};

export type OrderCreationContext = {
  cityId: number;
  pointId?: number;
  typeOrder?: number;
  streetId?: number;
  promoCode?: string;
  customerId?: number;
  phone?: string;
};

export type ValidatedCart = {
  cityId: number;
  pointId: number | null;
  valid: boolean;
  items: Array<{ itemId: number; name: string; quantity: number; unitPrice: number; total: number }>;
  subtotal: number;
  discount: number;
  total: number;
  delivery: { pointId: number; sumDiv: number; freeDrive: boolean; fee: number } | null;
  errors: Array<{ code: string; text?: string; itemId?: number }>;
};

export type OrderDraftInput = {
  cityId: number;
  pointId: number;
  customerId: number;
  typeOrder: number;
  addressId?: number;
  promoCode?: string;
  phone?: string;
  comment?: string;
  preorderAt?: string;
};

export type OrderDraft = {
  id: number;
  chefOrderId: number | null;
  status: string;
  cityId: number;
  pointId: number;
  customerId: number;
  typeOrder: number;
  cart: ValidatedCart;
};
