export interface OrderHistoryRow {
  orderId: number;
  pointId: number;
  date: string;
  orderNumber: string;
  status: string;
  total: number;
  canRepeat: boolean;
  onShowComposition?: () => void;
  onRepeat?: () => void;
}

export interface OrdersHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderHistoryRow[];
  loading?: boolean;
  error?: string | null;
}
