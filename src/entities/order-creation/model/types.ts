export type OrderCreationLine = {
  itemId: number;
  quantity: number;
  modifiers?: Array<{ itemId: number; quantity: number }>;
};

export type ValidatedCartModifier = {
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  billable: boolean;
};

export type ValidatedCartItem = {
  itemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  modifiers: ValidatedCartModifier[];
  modifierTotal: number;
  fixedPrice: boolean;
  promoAddition: boolean;
};

export type ValidatedPromo = {
  id: number;
  code: string;
  name: string;
  text: string;
  conditionText: string;
  freeDrive: boolean;
  additions: ValidatedCartItem[];
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
  items: ValidatedCartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promo: ValidatedPromo | null;
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
  /** Chef payment type. The current API accepts cash (1) only. */
  paymentType?: 1;
  /** Cash tendered by the customer, in whole rubles. */
  sdacha?: number;
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
