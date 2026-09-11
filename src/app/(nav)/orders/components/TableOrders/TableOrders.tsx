"use client";
import { Table } from "@/shared/ui/Table/Table";
import { getOrdersColumns } from "./TableOrders.columns";
import { useMemo, useState } from "react";
import { useOrdersStore } from "@/entities/Order/store/orders/ordersStore";
import { ColumnFilter } from "@/features/orders/ui/ColumnFilter/ColumnFilter";
import { orderStatus, STATUS_TABS } from "@/widgets/orders/utils/constants";
import { Order, TableOrdersProps } from "./TableOrders.types";
import { ModalOrderConfirm } from "@/features/order/ModalOrderConfirm/ModalOrderConfirm";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Typography/Typography";
import "./TableOrders.style.css";
import Image from "next/image";
import { ModalOrderCancel } from "../ModalOrderCancel/ModalOrderCancel";
import { OrderDto, ordersApi } from "@/entities/Order/api/ordersApi";

export const TableOrders = ({ orders }: TableOrdersProps) => {
  const {
    visibleColumns,
    statusFilter,
    typeFilter,
    createdByFilter,
    setStatusFilter,
    setTypeFilter,
    setCreatedByFilter,
    statusTab,
    typeTab,
    sortKey,
    sortDir,
    toggleSort,
    phone,
    address,
    searchQuery,
  } = useOrdersStore();
  const [activeColumn, setActiveColumn] = useState<"status" | "type" | "createdBy" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDto | null>(null);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const columns = getOrdersColumns(activeColumn, sortKey, sortDir, toggleSort).filter(
    (col) => visibleColumns[col.title],
  );

  const filteredOrders = useMemo(() => {
    const statusTabConfig = STATUS_TABS.find((tab) => tab.id === statusTab);

    let list = orders.filter((order) => {
      const matchesStatusFilter = statusFilter[orderStatus[order.status]?.label];
      const matchesTypeFilter = typeFilter[orderStatus[order.type]?.label];
      const matchesCreatedBy =
        order.createdBy === "—" ? true : createdByFilter[order.createdBy];

      let matchesStatusTab = true;
      if (statusTab === "preorder") {
        matchesStatusTab = Boolean(order.isPreorder) && order.status !== "cancel";
      } else if (statusTabConfig) {
        matchesStatusTab =
          statusTabConfig.statuses.includes(order.status) &&
          (statusTab === "active" ? !order.isPreorder : true);
      }

      const matchesTypeTab = typeTab === "all" || order.type === typeTab;

      const query = (searchQuery || phone || address).trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : String(order.orderNumber).includes(query) ||
          order.phone.toLowerCase().includes(query) ||
          order.address.toLowerCase().includes(query);

      return (
        matchesStatusFilter &&
        matchesTypeFilter &&
        matchesCreatedBy &&
        matchesStatusTab &&
        matchesTypeTab &&
        matchesSearch
      );
    });

    if (sortKey && sortDir) {
      list = [...list].sort((a, b) => {
        const left = String(a[sortKey as keyof Order] ?? "");
        const right = String(b[sortKey as keyof Order] ?? "");
        const cmp = left.localeCompare(right, "ru", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [
    orders,
    statusFilter,
    typeFilter,
    createdByFilter,
    statusTab,
    typeTab,
    sortKey,
    sortDir,
    phone,
    address,
    searchQuery,
  ]);

  const handleOrderSelect = async (order: Order) => {
    setSelectedOrder(order);
    setOrderDetails(null);

    try {
      const response = await ordersApi.show(order.id, order.pointId);
      setOrderDetails(response.data);
    } catch {
      setSelectedOrder(null);
    }
  };

  const handleCancelOrder = () => {
    setIsCancelOpen(false);
    setSelectedOrder(null);
  };

  const renderOrderActions = () => {
    if (!selectedOrder) return null;

    return (
      <div className="order-breakdown-group">
        <details className="group">
          <summary className="order-breakdown-summary">
            <Text>Расформировка</Text>
            <Image
              src="/icons/arrow-down.svg"
              alt="Стрелка"
              width={15}
              height={15}
              className="group-open:rotate-180"
            />
          </summary>
          <ul className="order-breakdown-items-list">
            {(orderDetails?.items ?? []).map((item) => (
              <li key={item.item_id} className="order-breakdown-item">
                <Text>{item.name ?? `Позиция ${item.item_id}`}</Text>
                <Text
                  className={
                    item.ready
                      ? "text-primary"
                      : "text-text-subtle"
                  }
                >
                  {item.ready ? "Приготовлен" : "В очереди"}
                </Text>
              </li>
            ))}
          </ul>
        </details>
        <Button
          variant="base"
          theme="error"
          size="md"
          onClick={() => setIsCancelOpen(true)}
          className="order-breakdown-cancel-button"
        >
          <Text variant="body-m-medium-16">Отменить заказ</Text>
        </Button>
      </div>
    );
  };

  return (
    <>
      <Table
        data={filteredOrders}
        columns={columns}
        height={564}
        rowHeight={52}
        rowGap={4}
        fontVariant="label-s-regular-12"
        onRowClick={(order) => void handleOrderSelect(order)}
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
      <ColumnFilter
        options={createdByFilter}
        onChange={setCreatedByFilter}
        id="created-by-filters"
        onToggle={(open) => setActiveColumn(open ? "createdBy" : null)}
      />
      <ModalOrderConfirm
        isOpen={!!selectedOrder}
        onClose={() => {
          setSelectedOrder(null);
          setOrderDetails(null);
        }}
        title={`Заказ ${selectedOrder?.orderNumber}`}
        deliveryType={orderDetails?.type === 2 ? "pickup" : "delivery"}
        deliveryTime={orderDetails?.date_time_preorder || orderDetails?.give_data_time || "Не указано"}
        clientPhone={orderDetails?.phone || selectedOrder?.phone || "Не указан"}
        address={orderDetails?.type_order_addr_new || formatAddress(orderDetails?.address) || selectedOrder?.address || "Не указан"}
        intercom="Не указан"
        payment={paymentLabel(orderDetails?.payment_type)}
        comment={orderDetails?.comment ?? undefined}
        items={(orderDetails?.items ?? []).map((item) => ({
          name: item.name ?? `Позиция ${item.item_id}`,
          quantity: Number(item.count),
          price: Number(item.price),
        }))}
        totalPrice={orderDetails?.order_price ?? selectedOrder?.amount ?? 0}
        renderActions={renderOrderActions}
      />
      <ModalOrderCancel
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onCancel={handleCancelOrder}
        orderNumber={selectedOrder?.orderNumber}
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
