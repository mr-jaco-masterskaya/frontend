import { OrderItem } from '@/widgets/Order/ui/OrderList/OrderList.types';

export interface ModalOrderConfirmProps {
  renderActions?: () => React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
  /** Returns false when validation blocks submission; true only after confirmation. */
  onConfirm?: () => boolean | void | Promise<boolean | void>;
  isConfirming?: boolean;

  /** Заголовок модалки, например "Заказ № 800602 от 23 октября 2025" */
  title: string;

  // Левая колонка
  deliveryType?: "delivery" | "pickup";
  deliveryTime: string;        // "Время ожидания 0:45-1:15"
  clientPhone: string;         // "+7 (999) 999-99-99"
  address: string;             // "г. Тольятти, ул. Ленинградская, 27..."
  intercom: string;            // "работает" | "не работает" | любая строка
  payment: string;             // "Наличный расчёт\nСдача с 5 000 рублей"
  promocode?: string;          // опционально
  promocodeDescription?: string;
  comment?: string;            // опционально

  // Правая колонка
  items: OrderItem[];
  totalPrice: number;
  deliveryPrice?: number;
}
