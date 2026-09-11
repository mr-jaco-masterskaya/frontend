import { describe, expect, it } from "vitest";
import type { OrderDto } from "@/entities/Order/api/ordersApi";
import { mapOrderDetails } from "./OrdersHistory.mapper";

const order: OrderDto = {
  id: 42,
  point_id: 7,
  point_name: "Точка",
  client_id: 5,
  phone: "79990000000",
  sum: 950,
  order_price: 900,
  type: 1,
  type_label: "Доставка",
  status: 4,
  status_label: "Приготовлен",
  payment_type: 1,
  driver_id: 0,
  driver: null,
  is_preorder: false,
  date_time_order: "2026-09-10 12:00:00",
  date_time_preorder: null,
  give_data_time: "2026-09-10 12:45:00",
  address: { street: "Ленина", home: "10", apartment: "4" },
  comment: "Позвонить",
  items: [
    {
      item_id: 11,
      name: "Ролл",
      price: "300",
      origin_price: "320",
      count: "3",
      ready: true,
    },
  ],
};

describe("mapOrderDetails", () => {
  it("maps the order detail API response to the client history modal", () => {
    expect(mapOrderDetails(order)).toEqual({
      deliveryType: "delivery",
      deliveryTime: "2026-09-10 12:45:00",
      clientPhone: "79990000000",
      address: "Ленина, д. 10, кв. 4",
      intercom: "Не указан",
      payment: "Наличный расчёт",
      comment: "Позвонить",
      items: [{ name: "Ролл", quantity: 3, price: 300 }],
      totalPrice: 900,
    });
  });

  it("uses safe fallbacks for incomplete order details", () => {
    expect(
      mapOrderDetails({
        ...order,
        type: 2,
        phone: null,
        payment_type: 2,
        date_time_order: null,
        give_data_time: null,
        address: {},
        comment: null,
        items: undefined,
      }),
    ).toMatchObject({
      deliveryType: "pickup",
      deliveryTime: "Не указано",
      clientPhone: "Не указан",
      address: "Не указан",
      payment: "Безналичный расчёт",
      items: [],
    });
  });
});
