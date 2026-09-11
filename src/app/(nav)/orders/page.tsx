"use client";

import { FiltersBlock } from "@/features/orders/ui/filtersBlock/FiltersBlock";
import { TableOrders } from "./components/TableOrders/TableOrders";
import { HeaderOrders } from "@/widgets/Header/ui/HeaderOrders/HeaderOrders";
import { useEffect, useMemo, useState } from "react";
import { CityDto, OrderDto, ordersApi, PointDto } from "@/entities/Order/api/ordersApi";
import { useOrdersStore } from "@/entities/Order/store/orders/ordersStore";
import type { Order } from "./components/TableOrders/TableOrders.types";
import { ApiError } from "@/shared/api/http";

export default function Orders() {
  const [cities, setCities] = useState<CityDto[]>([]);
  const [points, setPoints] = useState<PointDto[]>([]);
  const [orderDtos, setOrderDtos] = useState<OrderDto[]>([]);
  const [error, setError] = useState("");
  const {
    cityId,
    selectedPointId,
    date,
    refreshKey,
    setCityId,
    setSelectedPointId,
  } = useOrdersStore();

  useEffect(() => {
    let active = true;

    void ordersApi.cities()
      .then(({ data }) => {
        if (!active) return;
        setCities(data);
        setError("");
        const currentCityId = useOrdersStore.getState().cityId;
        setCityId(
          currentCityId && data.some((city) => city.id === currentCityId)
            ? currentCityId
            : (data[0]?.id ?? null),
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      });

    return () => {
      active = false;
    };
  }, [setCityId]);

  useEffect(() => {
    if (!cityId) return;
    let active = true;

    void ordersApi.points(cityId)
      .then(({ data }) => {
        if (!active) return;
        setPoints(data);
        setError("");
        const currentPointId = useOrdersStore.getState().selectedPointId;
        setSelectedPointId(
          currentPointId && data.some((point) => point.id === currentPointId)
            ? currentPointId
            : (data[0]?.id ?? null),
        );
      })
      .catch((reason: unknown) => {
        if (active) setError(errorMessage(reason));
      });

    return () => {
      active = false;
    };
  }, [cityId, setSelectedPointId]);

  useEffect(() => {
    if (!selectedPointId) return;
    const apiDate = toApiDate(date);
    if (!apiDate) return;
    let active = true;

    void ordersApi.list({
      pointId: selectedPointId,
      date: apiDate,
    })
      .then(({ data }) => {
        if (!active) return;
        setOrderDtos(data.items);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setOrderDtos([]);
        setError(errorMessage(reason));
      });

    return () => {
      active = false;
    };
  }, [date, refreshKey, selectedPointId]);

  const visiblePoints = points.filter((point) => point.city_id === cityId);
  const orders = useMemo(
    () => orderDtos.filter((order) => order.point_id === selectedPointId).map(mapOrder),
    [orderDtos, selectedPointId],
  );

  return (
    <div className="h-full flex flex-col gap-4">
      <HeaderOrders cities={cities}/>
      <FiltersBlock points={visiblePoints} orders={orders}/>
      {error && <p className="text-error">{error}</p>}
      <TableOrders orders={orders}/>
    </div>
  )
}

const STATUS_MAP: Record<number, Order["status"]> = {
  1: "inQueue",
  2: "cooking",
  3: "ready",
  4: "ready",
  5: "inDelivery",
  6: "completed",
};

const TYPE_MAP: Record<number, Order["type"]> = {
  1: "delivery",
  2: "takeaway",
  3: "room",
  4: "toGo",
};

const mapOrder = (order: OrderDto): Order => ({
  id: order.id,
  pointId: order.point_id,
  orderNumber: order.id,
  status: STATUS_MAP[order.status] ?? "inQueue",
  type: TYPE_MAP[order.type] ?? "delivery",
  createdBy: "—",
  phone: order.phone ?? "",
  address: order.type_order_addr_new || formatAddress(order.address),
  openedAt: formatTime(order.date_time_order),
  dueTime: formatTime(order.date_time_preorder),
  closedAtKitchen: "—",
  receivedAt: order.status === 6 ? formatTime(order.give_data_time) : "—",
  timeToOverdue: "—",
  promisedAt: formatTime(order.give_data_time || order.date_time_preorder),
  amount: order.order_price,
  payment: order.payment_type === 1 ? "нал" : "б/н",
  driver: order.driver ?? "—",
  isPreorder: order.is_preorder,
});

const formatAddress = (address: OrderDto["address"]) =>
  [
    address.street,
    address.home && `д. ${address.home}`,
    address.apartment && `кв. ${address.apartment}`,
  ]
    .filter(Boolean)
    .join(", ");

const formatTime = (value: string | null) => {
  if (!value) return "—";
  const match = value.match(/\b(\d{2}:\d{2})/);
  return match?.[1] ?? value;
};

const toApiDate = (value: string) => {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : undefined;
};

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : "Не удалось загрузить данные";