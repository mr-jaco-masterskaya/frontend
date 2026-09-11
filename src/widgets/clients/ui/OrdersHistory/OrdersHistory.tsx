import Image from "next/image";
import { Modal } from "@/shared/ui/Modal/Modal";
import { Table } from "@/shared/ui/Table/Table";
import { OrdersHistoryProps, OrderHistoryRow } from "./OrdersHistory.types";
import "./OrdersHistory.styles.css";
import { ordersHistoryColumns } from "./OrdersHistory.columns";
import { useRef, useState } from "react";
import { ModalOrderConfirm } from "@/features/order/ModalOrderConfirm/ModalOrderConfirm";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Typography/Typography";
import { ordersApi } from "@/entities/Order/api/ordersApi";
import { mapOrderDetails, type OrderDetailsView } from "./OrdersHistory.mapper";

export const OrdersHistory = ({
  isOpen,
  onClose,
  orders,
  loading = false,
  error = null,
}: OrdersHistoryProps) => {
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryRow | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetailsView | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const detailsRequestId = useRef(0);

  const loadOrderDetails = async (order: OrderHistoryRow) => {
    const requestId = ++detailsRequestId.current;
    setSelectedOrder(order);
    setOrderDetails(null);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const response = await ordersApi.show(order.orderId, order.pointId);
      if (requestId === detailsRequestId.current) {
        setOrderDetails(mapOrderDetails(response.data));
      }
    } catch (error) {
      if (requestId === detailsRequestId.current) {
        setDetailsError(
          error instanceof Error ? error.message : "Не удалось загрузить состав заказа",
        );
      }
    } finally {
      if (requestId === detailsRequestId.current) setDetailsLoading(false);
    }
  };

  const closeOrderDetails = () => {
    detailsRequestId.current += 1;
    setSelectedOrder(null);
    setOrderDetails(null);
    setDetailsError(null);
    setDetailsLoading(false);
  };

  const mappedOrders = orders.map((order) => ({
    ...order,
    onRepeat: order.canRepeat ? () => void loadOrderDetails(order) : undefined,
    onShowComposition: () => void loadOrderDetails(order),
  }));

  const renderOrderActions = () => {
    if (!selectedOrder) return null;

    if (detailsLoading) {
      return <Text className="orders-history__details-state">Загрузка состава заказа…</Text>;
    }

    if (detailsError) {
      return (
        <div className="orders-history__details-state" role="alert">
          <Text>{detailsError}</Text>
          <Button
            variant="base"
            theme="primary"
            size="sm"
            onClick={() => void loadOrderDetails(selectedOrder)}
          >
            Повторить
          </Button>
        </div>
      );
    }
    
    return selectedOrder.canRepeat ? (
      <div className="flex flex-col gap-2 items-end ml-auto">
          <Button variant="base" theme="primary" size="md" onClick={() => console.log("Повторить заказ!")} className="!w-[176px]">
            <Text variant="body-m-medium-16">Повторить заказ</Text>
          </Button>
      </div>
    ) : (
      <div className="flex flex-col gap-2 items-end ml-auto">
        <Button variant="base" theme="primary" size="md" disabled className="!w-[176px]">
          <Text variant="body-m-medium-16">Повторить заказ</Text>
        </Button>
        <div className="flex gap-2 w-[242px]">
          <Image
            src="/icons/info-error.svg"
            alt="Ошибка"
            width={14}
            height={14}
          />
          <Text variant="label-s-regular-12">Функция неактивна. Повторить можно только последние 3 заказа.</Text>
        </div>
      </div>
    )
  }
  
  return (
    <>
      <Modal title="История заказов" isOpen={isOpen} onClose={onClose}>
        <div className="orders-history__content">
          <span className="orders-history__subtitle">
            Последние 3 заказа можно повторить
          </span>
          <div className="orders-history__table-wrapper">
            {loading ? (
              <span>Загрузка истории заказов…</span>
            ) : error ? (
              <span>{error}</span>
            ) : mappedOrders.length === 0 ? (
              <span>У клиента пока нет заказов</span>
            ) : (
              <Table data={mappedOrders} columns={ordersHistoryColumns} width={796} height={304} rowHeight={56} headerHeight={52} variant="secondary" />
            )}
          </div>
        </div>
      </Modal>
      <ModalOrderConfirm
        isOpen={!!selectedOrder}
        onClose={closeOrderDetails}
        title={`Заказ ${selectedOrder?.orderNumber}`}
        deliveryType={orderDetails?.deliveryType}
        deliveryTime={orderDetails?.deliveryTime ?? "Загрузка…"}
        clientPhone={orderDetails?.clientPhone ?? "Загрузка…"}
        address={orderDetails?.address ?? "Загрузка…"}
        intercom={orderDetails?.intercom ?? "Загрузка…"}
        payment={orderDetails?.payment ?? "Загрузка…"}
        comment={orderDetails?.comment}
        items={orderDetails?.items ?? []}
        totalPrice={orderDetails?.totalPrice ?? selectedOrder?.total ?? 0}
        renderActions={renderOrderActions}
      />
    </>
  );
};
