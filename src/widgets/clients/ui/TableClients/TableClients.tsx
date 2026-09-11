'use client';
import { Table } from "@/shared/ui/Table/Table";
import { Client } from "./TableClients.types";
import { useState } from "react";
import { PromocodeList } from "../PromocodeList/PromocodeList";
import { useSearchFormStore } from "@/entities/client/store/searchForm/searchForm";
import { OrdersHistory } from "../OrdersHistory/OrdersHistory";
import { getClientsColumns } from "./TableClients.columns";
import { customerApi } from "@/entities/customer/api/customerApi";
import type { CustomerLookup, CustomerOrder } from "@/entities/customer/model/types";
import { Text } from "@/shared/ui/Typography/Typography";
import { emptyStateMessage } from "./TableClients.state";

function mapClient(lookup: CustomerLookup | null): Client | null {
  if (!lookup?.customer) return null;
  const address = lookup.addresses[0];
  return {
    id: lookup.customer.id,
    name: lookup.customer.name,
    phone: lookup.customer.phone,
    address: address ? [address.cityName, address.street, address.home, address.apartment ? `кв. ${address.apartment}` : ""].filter(Boolean).join(", ") : "",
  };
}

function mapClientCityId(lookup: CustomerLookup | null): number | undefined {
  const address = lookup?.addresses.find((item) => item.isMain) ?? lookup?.addresses[0];
  return address?.cityId || lookup?.lastOrder?.cityId || undefined;
}

export const TableClients = () => {
  const [selectedClientHistory, setSelectedClientHistory] = useState<Client | null>(null);
  const [selectedClientPromo, setSelectedClientPromo] = useState<Client | null>(null);
  const { lookup, foundClientId, loading, searched, error } = useSearchFormStore();
  const client = mapClient(lookup);
  const clientCityId = mapClientCityId(lookup);
  const [historyOrders, setHistoryOrders] = useState<CustomerOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const handleHistoryClick = async (row: Client) => {
    setSelectedClientHistory(row);
    setHistoryOrders([]);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      setHistoryOrders(await customerApi.orders(row.id));
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Не удалось загрузить историю заказов");
    } finally {
      setHistoryLoading(false);
    }
  };
  const columns = getClientsColumns(handleHistoryClick, setSelectedClientPromo);

  return (
    <>
      {client ? (
        <Table 
          data={[client]}
          columns={columns}
          height={592}
          rowHeight={56}
          rowGap={8}
          foundRow={foundClientId !== null ? 0 : null}
        />
      ) : (
        <div className="flex h-[592px] items-center justify-center" role={error ? "alert" : undefined}>
          <Text className="text-text-secondary">{emptyStateMessage({ loading, error, searched })}</Text>
        </div>
      )}
      <OrdersHistory
        isOpen={!!selectedClientHistory}
        onClose={() => setSelectedClientHistory(null)}
        orders={historyOrders.map((order, index) => ({
          orderId: order.orderId,
          pointId: order.pointId,
          date: order.dateTime ? new Date(order.dateTime).toLocaleDateString("ru-RU") : "—",
          orderNumber: `#${order.orderId}`,
          status: order.statusLabel || "—",
          total: order.sum,
          canRepeat: index < 3,
        }))}
        loading={historyLoading}
        error={historyError}
      />      
      <PromocodeList isOpen={!!selectedClientPromo} cityId={clientCityId} onClose={() => setSelectedClientPromo(null)}/>
    </>
  );
}
