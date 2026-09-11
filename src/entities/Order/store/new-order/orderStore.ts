import { create } from 'zustand';
import { CartItem } from '@/widgets/Order/ui/Cart/Cart.types';
import { ORDER_STEP } from '@/utils/constants';
import { mockCities } from '@/app/(nav)/order-new/data/mocks';

type DeliveryType = 'delivery' | 'pickup';
type TimeMode = 'nearest' | 'by-time' | null;

interface DeliveryForm {
  address: string;
  streetId: number | null;
  pointId: number | null;
  cafeId: string | null;
  coordinates: [number, number] | null;
  building: string;
  entrance: string;
  floor: string;
  apartment: string;
  intercom: 'working' | 'not-working' | null;
  addressCheckStatus: null | 'success' | 'error';
}

interface PickupForm {
  cafe: string;
  cafeCheckStatus: null | 'success' | 'error';
}

interface PaymentForm {
  method: 'cash' | 'card' | null;
  cashAmount: string;
  comment: string;
}

interface TimeForm {
  date: string;
  time: string;
  isTimeSaved: boolean;
}

interface OrderState {
  step: ORDER_STEP;
  items: CartItem[];
  city: string;
  cityId: number | null;
  phone: string;
  customerId: number | null;
  addressId: number | null;
  pointId: number | null;
  promocode: string;
  deliveryType: DeliveryType;
  delivery: DeliveryForm;
  pickup: PickupForm;
  payment: PaymentForm;
  timeMode: TimeMode;
  time: TimeForm;
  orderNumber: number | null;
}

interface OrderActions {
  setStep: (step: ORDER_STEP) => void;

  addItem: (item: Omit<CartItem, 'count'>) => void;
  increaseItem: (id: string) => void;
  decreaseItem: (id: string) => void;
  deleteItem: (id: string) => void;

  setCity: (city: string) => void;
  setCityId: (cityId: number | null) => void;
  setPhone: (val: string) => void;
  setCustomerId: (customerId: number | null) => void;
  setAddressId: (addressId: number | null) => void;
  setPointId: (pointId: number | null) => void;
  setPromocode: (val: string) => void;

  setDeliveryType: (val: DeliveryType) => void;
  setDelivery: (val: Partial<DeliveryForm>) => void;
  setPickup: (val: Partial<PickupForm>) => void;
  setPayment: (val: Partial<PaymentForm>) => void;
  setTimeMode: (val: TimeMode) => void,
  setTime: (val: Partial<TimeForm>) => void;

  setOrderNumber: (num: number) => void;

  resetOrder: () => void;
}

const initialState: OrderState = {
  step: ORDER_STEP.CART,
  items: [],
  city: mockCities[0],
  cityId: null,
  phone: '',
  customerId: null,
  addressId: null,
  pointId: null,
  promocode: '',
  deliveryType: 'delivery',
  delivery: {
    address: '',
    streetId: null,
    pointId: null,
    cafeId: null,
    coordinates: null,
    building: '',
    entrance: '',
    floor: '',
    apartment: '',
    intercom: null,
    addressCheckStatus: null,
  },
  pickup: {
    cafe: '',
    cafeCheckStatus: null,
  },
  payment: {
    method: null,
    cashAmount: '',
    comment: '',
  },
  timeMode: null,
  time: {
    date: '',
    time: '',
    isTimeSaved: false,
  },
  orderNumber: null,
};

type OrderStore = OrderState & OrderActions;

export const useOrderStore = create<OrderStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  // Корзина
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === item.id);
      return {
        items: existing
          ? state.items.map((i) =>
              i.id === item.id ? { ...i, count: i.count + 1 } : i,
            )
          : [...state.items, { ...item, count: 1 }],
      };
    }),
  increaseItem: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, count: i.count + 1 } : i,
      ),
    })),
  decreaseItem: (id) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id && i.count > 1 ? { ...i, count: i.count - 1 } : i,
      ),
    })),
  deleteItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),


  // Шапка
  setCity: (city) => set({ city }),
  setCityId: (cityId) => set({ cityId }),
  setPhone: (phone) => set({ phone }),
  setCustomerId: (customerId) => set({ customerId }),
  setAddressId: (addressId) => set({ addressId }),
  setPointId: (pointId) => set({ pointId }),
  setPromocode: (promocode) => set({ promocode }),
  setOrderNumber: (orderNumber) => set({ orderNumber }),

  // Формы
  setDeliveryType: (deliveryType) => set({ deliveryType }),
  setDelivery: (val) =>
    set((state) => ({ delivery: { ...state.delivery, ...val } })),
  setPickup: (val) =>
    set((state) => ({ pickup: { ...state.pickup, ...val } })),
  setPayment: (val) =>
    set((state) => ({ payment: { ...state.payment, ...val } })),
  setTimeMode: (val: TimeMode) => set({ timeMode: val }),
  setTime: (val) =>
    set((state) => ({ time: { ...state.time, ...val } })),

  // Сброс
  resetOrder: () => set(initialState),
}));
