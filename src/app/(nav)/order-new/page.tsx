"use client";
import { useState } from "react";
import { useOrderStore } from "@/entities/Order/store/new-order/orderStore";
import { ORDER_STEP } from "@/utils/constants";
import { Cart } from "@/widgets/Order/ui/Cart/Cart";
import { OrderPreviewModal } from "@/features/ModalOrderList/ui/OrderPreviewModal/OrderPreviewModal";
import { ModalOrderConfirm } from "@/features/order/ModalOrderConfirm/ModalOrderConfirm";
import { Tab } from "@/shared/ui/Tab/Tab";
import { DeliveryForm } from "./components/DeliveryForm/DeliveryForm";
import "./CurrentOrderPage.styles.css";
import { HeaderNewOrder } from "./components/HeaderNewOrder/HeaderNewOrder";
import { OrderCatalogStep } from "./components/OrderCatalogStep/OrderCatalogStep";
import { submitOrder } from "@/entities/order-creation/api/orderCreationWorkflow";
import { orderCreationApi } from "@/entities/order-creation/api/orderCreationApi";
import type { ValidatedCart } from "@/entities/order-creation/model/types";
import { ApiError } from "@/shared/api/http";
import { customerApi } from "@/entities/customer/api/customerApi";
import { deliveryApi } from "@/entities/delivery/api/deliveryApi";
import { citiesApi } from "@/entities/city/api/citiesApi";
import { pointsApi } from "@/entities/point/api/pointsApi";
import { normalizeHome, splitStreetAndHome } from "./model/orderAddress";
import { toPreorderAt } from "./model/orderSchedule";
import { validateDeliveryDetails } from "./model/orderDelivery";
import { paymentDraftFields } from "./model/orderPayment";

export default function CurrentOrderPage() {
  const step = useOrderStore((s) => s.step);
  const setStep = useOrderStore((s) => s.setStep);
  const items = useOrderStore((s) => s.items);
  const increaseItem = useOrderStore((s) => s.increaseItem);
  const decreaseItem = useOrderStore((s) => s.decreaseItem);
  const deleteItem = useOrderStore((s) => s.deleteItem);
  const phone = useOrderStore((s) => s.phone);
  const cityId = useOrderStore((s) => s.cityId);
  const customerId = useOrderStore((s) => s.customerId);
  const addressId = useOrderStore((s) => s.addressId);
  const pointId = useOrderStore((s) => s.pointId);
  const delivery = useOrderStore((s) => s.delivery);
  const payment = useOrderStore((s) => s.payment);
  const orderNumber = useOrderStore((s) => s.orderNumber);
  const resetOrder = useOrderStore((s) => s.resetOrder);
  const deliveryType = useOrderStore((s) => s.deliveryType);
  const promocode = useOrderStore((s) => s.promocode);
  const pickup = useOrderStore((s) => s.pickup);
  const time = useOrderStore((s) => s.time);
  const timeMode = useOrderStore((s) => s.timeMode);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<number | null>(null);
  const [validatedCart, setValidatedCart] = useState<ValidatedCart | null>(null);

  const deliveryPrice = validatedCart?.delivery?.fee ?? 0;

  const itemsTotal = items.reduce(
    (acc, item) => acc + item.price * item.count,
    0,
  );

  const totalPrice = validatedCart?.total ?? itemsTotal + deliveryPrice;

  const confirmationItems = validatedCart
    ? validatedCart.items.map((item) => ({
        name: item.name || `Товар #${item.itemId}`,
        quantity: item.quantity,
        price: item.unitPrice,
      }))
    : items.map((item) => ({
        name: item.name,
        quantity: item.count,
        price: item.price,
      }));

  const validateBeforeConfirmation = (): string | null => {
    const paymentResult = paymentDraftFields(payment.method, payment.cashAmount);
    if (!paymentResult.valid) return paymentResult.message;
    if (deliveryType !== "delivery") return null;
    const result = validateDeliveryDetails({
      address: delivery.address,
      addressCheckStatus: delivery.addressCheckStatus,
      entrance: delivery.entrance,
      floor: delivery.floor,
      apartment: delivery.apartment,
    });
    return result.valid ? null : result.message ?? "Проверьте данные доставки";
  };

  const prepareConfirmation = async () => {
    const deliveryError = validateBeforeConfirmation();
    if (deliveryError) {
      setValidatedCart(null);
      setConfirmError(deliveryError);
      setIsConfirmOpen(true);
      return;
    }
    const selectedCityId = cityId;
    const selectedPointId = deliveryType === "delivery" ? delivery.pointId : pointId;
    if (!selectedCityId || !selectedPointId || items.length === 0) {
      setValidatedCart(null);
      setIsConfirmOpen(true);
      return;
    }
    setIsSubmitting(true);
    setConfirmError(null);
    try {
      const cart = await orderCreationApi.validateCart({
        cityId: selectedCityId,
        pointId: selectedPointId,
        typeOrder: deliveryType === "delivery" ? 1 : 2,
        streetId: deliveryType === "delivery" ? delivery.streetId ?? undefined : undefined,
        promoCode: promocode || undefined,
        customerId: customerId ?? undefined,
        phone: phone || undefined,
        items: items.map((item) => ({ itemId: Number(item.id), quantity: item.count })),
      });
      setValidatedCart(cart);
      if (!cart.valid) setConfirmError("Корзина изменилась. Проверьте состав заказа");
    } catch (error) {
      setValidatedCart(null);
      setConfirmError(error instanceof Error ? error.message : "Не удалось проверить корзину");
    } finally {
      setIsSubmitting(false);
      setIsConfirmOpen(true);
    }
  };

  const handleConfirm = async () => {
    setConfirmError(null);
    const deliveryError = validateBeforeConfirmation();
    if (deliveryError) {
      setConfirmError(deliveryError);
      return;
    }
    if (validatedCart && !validatedCart.valid) {
      setConfirmError("Корзина изменилась. Проверьте состав заказа");
      return;
    }
    const typeOrder = deliveryType === "delivery" ? 1 : 2;
    const paymentResult = paymentDraftFields(payment.method, payment.cashAmount);
    if (!paymentResult.valid) {
      setConfirmError(paymentResult.message);
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedCityId = cityId ?? (await citiesApi.list()).find((city) => city.name === useOrderStore.getState().city)?.id;
      if (!selectedCityId) throw new Error("Не удалось определить город заказа");

      const lookup = customerId ? null : await customerApi.lookup(phone, selectedCityId);
      const selectedCustomerId = customerId ?? lookup?.customer?.id;
      if (!selectedCustomerId) throw new Error("Клиент не найден. Нажмите «Найти» или проверьте телефон");

      const customerAddresses = lookup?.addresses ?? await customerApi.addresses(selectedCustomerId, selectedCityId);
      let selectedPointId = deliveryType === "delivery" ? delivery.pointId : pointId;
      let selectedAddressId = deliveryType === "delivery" ? addressId : null;
      let selectedStreetId = deliveryType === "delivery" ? delivery.streetId ?? undefined : undefined;

      if (deliveryType === "delivery") {
        const parsedAddress = splitStreetAndHome(delivery.address);
        if (!parsedAddress) throw new Error("Укажите улицу и дом в поле адреса");

        if (!selectedStreetId || !selectedPointId) {
          const streets = await deliveryApi.streets(selectedCityId, parsedAddress.street);
          const matchedStreet = streets.find((street) => normalizeHome(street.home) === normalizeHome(parsedAddress.home));
          selectedStreetId = selectedStreetId ?? matchedStreet?.id;
          selectedPointId = selectedPointId ?? matchedStreet?.pointId ?? null;
        }

        const matchingAddress = customerAddresses.find((savedAddress) =>
          (selectedStreetId === undefined || savedAddress.streetId === selectedStreetId)
          && normalizeHome(savedAddress.home) === normalizeHome(parsedAddress.home)
          && savedAddress.cityId === selectedCityId,
        );
        selectedAddressId = selectedAddressId ?? matchingAddress?.id ?? null;
        selectedPointId = selectedPointId ?? matchingAddress?.delivery.pointId ?? null;
        if (!selectedAddressId && selectedStreetId) {
          const createdAddress = await customerApi.createAddress(selectedCustomerId, {
            cityId: selectedCityId,
            streetId: selectedStreetId,
            apartment: delivery.apartment || undefined,
            entrance: delivery.entrance || undefined,
            floor: delivery.floor || undefined,
            domTrue: delivery.intercom === "working" ? true : delivery.intercom === "not-working" ? false : undefined,
            comment: payment.comment || undefined,
            isMain: false,
          });
          selectedAddressId = createdAddress.id;
          selectedPointId = selectedPointId ?? createdAddress.delivery.pointId;
        }
        if (!selectedAddressId) throw new Error("Не удалось сохранить адрес клиента");
      } else if (!selectedPointId) {
        const points = await pointsApi.list(selectedCityId);
        selectedPointId = points.find((point) => point.address === pickup.cafe || point.name === pickup.cafe)?.id ?? null;
      }

      if (!selectedPointId) throw new Error("Не удалось определить точку получения");

      const confirmedOrder = await submitOrder({
        cityId: selectedCityId,
        pointId: selectedPointId,
        customerId: selectedCustomerId,
        typeOrder,
        addressId: deliveryType === "delivery" ? selectedAddressId ?? undefined : undefined,
        streetId: deliveryType === "delivery" ? selectedStreetId : undefined,
        promoCode: promocode || undefined,
        phone: phone || undefined,
        comment: payment.comment || undefined,
        preorderAt: timeMode === "by-time" && time.isTimeSaved
          ? toPreorderAt(time.date, time.time) ?? undefined
          : undefined,
        ...paymentResult.fields,
        fakeDom: deliveryType === "delivery" && delivery.intercom !== null
          ? delivery.intercom === "working"
          : undefined,
        items: items.map((item) => ({ itemId: Number(item.id), quantity: item.count })),
      });
      setConfirmedOrderNumber(confirmedOrder.chefOrderId ?? confirmedOrder.id);
      setIsConfirmOpen(false);
      resetOrder();
    } catch (error) {
      const message = error instanceof ApiError && error.code
        ? `${error.code}: ${error.message}`
        : error instanceof Error ? error.message : "Не удалось создать заказ";
      setConfirmError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setIsConfirmOpen(false);
    resetOrder();

  };

  const intercomLabel =
    delivery.intercom === "working"
      ? "работает"
      : delivery.intercom === "not-working"
        ? "не работает"
        : "—";

  const addressFull = deliveryType === "pickup" ? pickup.cafe : [
    delivery.address,
    delivery.building && `корп. ${delivery.building}`,
    delivery.entrance && `п. ${delivery.entrance}`,
    delivery.floor && `эт. ${delivery.floor}`,
    delivery.apartment && `кв. ${delivery.apartment}`,
  ]
    .filter(Boolean)
    .join(", ");

  const paymentLabel =
    payment.method === "cash"
      ? `Наличный расчёт${payment.cashAmount ? `\nСдача с ${payment.cashAmount} рублей` : ""}`
      : payment.method === "card"
        ? "Безналичный расчёт" : "—";

  const nearestLabel = deliveryType === "delivery" ? "Время ожидания" : "Время приготовления";
  const scheduledLabel = deliveryType === "delivery" ? "Доставим" : "Заберут";
  const nearestTime = deliveryType === "delivery" ? "1:25 - 1:55" : "0:10 - 0:15";
  const deliveryTime = timeMode === "by-time" ? `${scheduledLabel} ${time.date}, ${time.time}` : `${nearestLabel} ${nearestTime}`;

  return (
    <div className="current-order">
      <main className="current-order__main">
        <HeaderNewOrder/>

        <p className="current-order__prep-time">Время приготовления от 10 до 15 минут</p>

        <div className="current-order__tabs">
          <Tab
            title="Заказ"
            active={step === ORDER_STEP.CART}
            variant="default"
            onClick={() => setStep(ORDER_STEP.CART)}
            className="current-order__tab"
          />
          <Tab
            title="Время и место получения"
            active={step === ORDER_STEP.DELIVERY}
            variant="default"
            onClick={() => setStep(ORDER_STEP.DELIVERY)}
            className="current-order__tab"
          />
        </div>

        <div className="current-order__content">
          {step === ORDER_STEP.CART && <OrderCatalogStep/>}
          {step === ORDER_STEP.DELIVERY && <DeliveryForm/>}
        </div>
      </main>

      <Cart
        items={items}
        deliveryPrice={deliveryPrice}
        step={step}
        onOpenOrderInfo={() => setIsPreviewOpen(true)}
        onCancel={resetOrder}
        onIncrease={increaseItem}
        onDecrease={decreaseItem}
        onDelete={deleteItem}
        onNext={() => {
          if (step === ORDER_STEP.CART) {
            setStep(ORDER_STEP.DELIVERY);
            return;
          }
          setConfirmedOrderNumber(null);
          void prepareConfirmation();
        }}
      />

      <OrderPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        orderNumber={orderNumber ?? 0}
        items={confirmationItems}
        totalPrice={totalPrice}
        deliveryPrice={deliveryPrice}
      />

      <ModalOrderConfirm
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onCancel={handleCancelConfirm}
        onEdit={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirm}
        confirmError={confirmError ?? undefined}
        isConfirming={isSubmitting}
        title={`Заказ № ${confirmedOrderNumber ?? orderNumber ?? "—"} от ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}`}
        deliveryType={deliveryType}
        deliveryTime={deliveryTime}
        clientPhone={`+7 (${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6,8)}-${phone.slice(8,10)}`}
        address={addressFull || "—"}
        intercom={intercomLabel}
        payment={paymentLabel}
        comment={payment.comment || undefined}
        items={confirmationItems}
        totalPrice={totalPrice}
        deliveryPrice={deliveryPrice}
        promocode={promocode || undefined}
      />
    </div>
  );
}
