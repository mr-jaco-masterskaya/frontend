"use client";

import { Table } from "@/shared/ui/Table/Table";
import { useMemo, useState } from "react";
import { getKitchenColumns } from "./TableKitchen.columns";
import { orderStatus, STATUS_TABS } from "@/widgets/orders/utils/constants";
import { useKitchenStore } from "@/entities/Order/store/kitchen/kitchenStore";
import { ColumnFilter } from "@/features/orders/ui/ColumnFilter/ColumnFilter";
import { KitchenOrder, TableKitchenProps } from "./TableKitchen.types";
import { ModalOrderConfirm } from "@/features/order/ModalOrderConfirm/ModalOrderConfirm";
import { type OrderDto, ordersApi } from "@/entities/Order/api/ordersApi";
import { Text } from "@/shared/ui/Typography/Typography";

export const TableKitchen = ({ orders }: TableKitchenProps) => {
  const {
    foundOrderNumber,
    statusFilter,
    typeFilter,
    setStatusFilter,
    setTypeFilter,
    visibleColumns,
    statusTab,
    typeTab,
    sortKey,
    sortDir,
    toggleSort,
  } = useKitchenStore();

  const [activeColumn, setActiveColumn] = useState<"status" | "type" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDto | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const columns = getKitchenColumns(activeColumn, sortKey, sortDir, toggleSort).filter(
    (col) => visibleColumns[col.title],
  );

  const filteredOrders = useMemo(() => {
    const statusTabConfig = STATUS_TABS.find((tab) => tab.id === statusTab);

    let list = orders.filter((order) => {
      const matchesStatusFilter = statusFilter[orderStatus[order.status]?.label];
      const matchesTypeFilter = typeFilter[orderStatus[order.type]?.label];

      let matchesStatusTab = true;
      if (statusTab === "preorder") {
        matchesStatusTab = Boolean(order.isPreorder) && order.status !== "cancel";
      } else if (statusTabConfig) {
        matchesStatusTab =
          statusTabConfig.statuses.includes(order.status) &&
          (statusTab === "active" ? !order.isPreorder : true);
      }

      const matchesTypeTab = typeTab === "all" || order.type === typeTab;

      return matchesStatusFilter && matchesTypeFilter && matchesStatusTab && matchesTypeTab;
    });

    if (sortKey && sortDir) {
      list = [...list].sort((a, b) => {
        const left = String(a[sortKey as keyof KitchenOrder] ?? "");
        const right = String(b[sortKey as keyof KitchenOrder] ?? "");
        const cmp = left.localeCompare(right, "ru", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [orders, statusFilter, typeFilter, statusTab, typeTab, sortKey, sortDir]);

  const foundRow =
    foundOrderNumber === null
      ? null
      : filteredOrders.findIndex((order) => order.number === foundOrderNumber);

  const openOrder = async (order: KitchenOrder) => {
    setSelectedOrder(order);
    setOrderDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const { data } = await ordersApi.kitchenShow(order.id);
      setOrderDetails(data);
    } catch (error) {
      setDetailsError(error instanceof Error ? error.message : "Не удалось загрузить заказ");
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeOrder = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
    setDetailsError(null);
    setDetailsLoading(false);
  };

  return (
    <>
      <Table
        data={filteredOrders}
        columns={columns}
        height={564}
        rowHeight={52}
        rowGap={4}
        headerHeight={60}
        fontVariant="label-s-regular-12"
        foundRow={foundRow === -1 ? null : foundRow}
        onRowClick={(order) => void openOrder(order)}
      />
      <ColumnFilter
        options={statusFilter}
        onChange={setStatusFilter}
        allLabel="Все статусы"
        id="status-filters"
        onToggle={(open) => setActiveColumn(open ? "status" : null)}
      />
      <ColumnFilter
        options={typeFilter}
        onChange={setTypeFilter}
        allLabel="Все типы"
        id="type-filters"
        onToggle={(open) => setActiveColumn(open ? "type" : null)}
      />
      <ModalOrderConfirm
        isOpen={selectedOrder !== null}
        onClose={closeOrder}
        title={`Заказ #${selectedOrder?.number ?? ""}`}
        deliveryType={orderDetails?.type === 2 ? "pickup" : "delivery"}
        deliveryTime={orderDetails?.date_time_preorder || orderDetails?.give_data_time || orderDetails?.date_time_order || "Не указано"}
        clientPhone={orderDetails?.phone || "Не указан"}
        address={orderDetails?.type_order_addr_new || formatAddress(orderDetails?.address) || "Не указан"}
        intercom="Не указан"
        payment={paymentLabel(orderDetails?.payment_type)}
        comment={orderDetails?.comment ?? undefined}
        items={(orderDetails?.items ?? []).map((item) => ({
          name: item.name ?? `Позиция ${item.item_id}`,
          quantity: Number(item.count),
          price: Number(item.price),
        }))}
        totalPrice={orderDetails?.order_price ?? selectedOrder?.amount ?? 0}
        renderActions={() => {
          if (detailsLoading) return <Text>Загрузка заказа…</Text>;
          if (detailsError) return <Text className="text-error">{detailsError}</Text>;
          return null;
        }}
      />
    </>
  );
};

const formatAddress = (address?: OrderDto["address"]) => {
  if (!address) return "";

  return [
    address.street,
    address.home && `д. ${address.home}`,
    address.apartment && `кв. ${address.apartment}`,
  ]
    .filter(Boolean)
    .join(", ");
};

const paymentLabel = (paymentType?: number) => {
  if (paymentType === undefined) return "Не указана";
  return paymentType === 1 ? "Наличный расчёт" : "Безналичный расчёт";
};
