import type { OrderDto } from "@/entities/Order/api/ordersApi";

export type OrderDetailsView = {
  deliveryType: "delivery" | "pickup";
  deliveryTime: string;
  clientPhone: string;
  address: string;
  intercom: string;
  payment: string;
  comment?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalPrice: number;
};

export function mapOrderDetails(order: OrderDto): OrderDetailsView {
  return {
    deliveryType: order.type === 2 ? "pickup" : "delivery",
    deliveryTime:
      order.date_time_preorder ||
      order.give_data_time ||
      order.date_time_order ||
      "Не указано",
    clientPhone: order.phone || "Не указан",
    address: formatAddress(order.address) || "Не указан",
    intercom: "Не указан",
    payment: order.payment_type === 1 ? "Наличный расчёт" : "Безналичный расчёт",
    comment: order.comment ?? undefined,
    items: (order.items ?? []).map((item) => ({
      name: item.name ?? `Позиция ${item.item_id}`,
      quantity: Number(item.count),
      price: Number(item.price),
    })),
    totalPrice: Number(order.order_price ?? order.sum),
  };
}

function formatAddress(address: OrderDto["address"]): string {
  return [
    address.street,
    address.home && `д. ${address.home}`,
    address.apartment && `кв. ${address.apartment}`,
  ]
    .filter(Boolean)
    .join(", ");
}
