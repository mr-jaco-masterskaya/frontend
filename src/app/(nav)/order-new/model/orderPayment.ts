export type PaymentMethod = "cash" | "card" | null;

export type PaymentDraftFields = {
  paymentType: 1;
  sdacha: number;
};

export type PaymentValidation =
  | { valid: true; fields: PaymentDraftFields }
  | { valid: false; message: string };

/**
 * Chef stores the customer's tendered cash amount in whole rubles. The
 * field is called `sdacha` for compatibility, although it is not the change
 * itself and the API deliberately does not calculate change.
 */
export function parseCashAmount(value: string): number | null {
  const normalized = value.trim();
  if (normalized === "") return 0;
  if (!/^\d+$/.test(normalized)) return null;

  const amount = Number(normalized);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : null;
}

/**
 * Converts the existing order-new payment state into the API contract.
 * Card remains visible in the current UI, but the call-center API intentionally
 * rejects non-cash orders until a payment provider contract is approved.
 */
export function paymentDraftFields(method: PaymentMethod, cashAmount: string): PaymentValidation {
  if (method === "card") {
    return { valid: false, message: "Безналичный расчёт пока недоступен для заказов колл-центра" };
  }

  const sdacha = parseCashAmount(cashAmount);
  if (sdacha === null) {
    return { valid: false, message: "Введите сумму наличными целым числом рублей" };
  }

  return { valid: true, fields: { paymentType: 1, sdacha } };
}

