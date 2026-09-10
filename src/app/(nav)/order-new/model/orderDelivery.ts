export type DeliveryDetails = {
  address: string;
  addressCheckStatus: null | 'success' | 'error';
  entrance: string;
  floor: string;
  apartment: string;
};

export type DeliveryValidationResult = {
  valid: boolean;
  message?: string;
  field?: keyof DeliveryDetails;
};

const requiredFields: Array<keyof Pick<DeliveryDetails, 'entrance' | 'floor' | 'apartment'>> = [
  'entrance',
  'floor',
  'apartment',
];

/**
 * Validates only data required to hand a delivery order to the API.
 * Building/corpus is deliberately optional: Chef has no corpus field.
 */
export function validateDeliveryDetails(value: DeliveryDetails): DeliveryValidationResult {
  if (!value.address.trim()) {
    return { valid: false, field: 'address', message: 'Укажите улицу и дом' };
  }

  if (value.addressCheckStatus !== 'success') {
    return { valid: false, field: 'address', message: 'Проверьте адрес кнопкой «Найти»' };
  }

  for (const field of requiredFields) {
    if (!value[field].trim()) {
      const labels: Record<typeof field, string> = {
        entrance: 'подъезд',
        floor: 'этаж',
        apartment: 'квартиру',
      };
      return { valid: false, field, message: `Укажите ${labels[field]}` };
    }
  }

  return { valid: true };
}
