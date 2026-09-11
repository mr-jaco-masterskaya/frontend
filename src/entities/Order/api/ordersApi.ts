import { apiRequest } from "@/shared/api/http";

export type CityDto = {
  id: number;
  name: string;
  slug: string;
};

export type PointDto = {
  id: number;
  city_id: number;
  city?: { id: number; name: string } | null;
  name: string;
  address: string;
  base: string;
};

export type OrderItemDto = {
  item_id: number;
  name: string | null;
  price: number | string;
  origin_price: number | string;
  count: number | string;
  ready: number | boolean;
};

export type OrderDto = {
  id: number;
  point_id: number;
  point_name: string;
  client_id: number;
  phone: string | null;
  sum: number;
  order_price: number;
  type: number;
  type_label: string;
  status: number;
  status_label: string;
  payment_type: number;
  driver_id: number;
  driver: string | null;
  is_preorder: boolean;
  date_time_order: string | null;
  date_time_preorder: string | null;
  give_data_time: string | null;
  address: {
    street?: string;
    home?: string;
    apartment?: string;
  };
  type_order_addr_new?: string | null;
  comment: string | null;
  items?: OrderItemDto[];
};

type ResourceCollection<T> = { data: T[] };
type SuccessResponse<T> = { st: true; data: T };

export type OrdersQuery = {
  pointId: number;
  date?: string;
  perPage?: number;
};

const withQuery = (path: string, params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

export const ordersApi = {
  cities() {
    return apiRequest<ResourceCollection<CityDto>>("/cities", { method: "GET" });
  },

  points(cityId?: number) {
    return apiRequest<ResourceCollection<PointDto>>(
      withQuery("/points", { city_id: cityId }),
      { method: "GET" },
    );
  },

  list({ pointId, date, perPage = 100 }: OrdersQuery) {
    return apiRequest<SuccessResponse<{ items: OrderDto[]; total: number; per_page: number }>>(
      withQuery("/orders", {
        point_id: pointId,
        date_from: date,
        date_to: date,
        per_page: perPage,
      }),
      { method: "GET" },
    );
  },

  show(orderId: number, pointId: number) {
    return apiRequest<SuccessResponse<OrderDto>>(
      withQuery(`/orders/${orderId}`, { point_id: pointId }),
      { method: "GET" },
    );
  },

  kitchenList({ pointId, date, perPage = 100 }: OrdersQuery) {
    return apiRequest<SuccessResponse<{ items: OrderDto[]; total: number; per_page: number }>>(
      withQuery("/kitchen/orders", {
        point_id: pointId,
        date_from: date,
        date_to: date,
        per_page: perPage,
      }),
      { method: "GET" },
    );
  },

  kitchenShow(orderId: number) {
    return apiRequest<SuccessResponse<OrderDto>>(`/kitchen/orders/${orderId}`, {
      method: "GET",
    });
  },
};
