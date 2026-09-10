import { Button } from "@/shared/ui/Button/Button"
import { Input } from "@/shared/ui/Input/Input"
import { Tooltip } from "@/shared/ui/Tooltip/Tooltip"
import "./HeaderNewOrder.style.css";
import { useOrderStore } from "@/entities/Order/store/new-order/orderStore"
import { SelectTown } from "@/shared/ui/SelectTown/SelectTown"
import { InputPhone } from "@/features/Inputs/ui/InputPhone/InputPhone"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/shared/ui/Typography/Typography";
import { useOrderCreationCity } from "@/entities/order-creation/api/orderCreationQueries";
import { promoApi } from "@/entities/promo/api/promoApi";
import { customerApi } from "@/entities/customer/api/customerApi";
import { CustomerCreateModal } from "../CustomerCreateModal/CustomerCreateModal";
import type { CustomerCreateResult } from "@/entities/customer/model/types";

export const HeaderNewOrder = () => {
  const {
    city,
    phone,
    promocode,
    setCity,
    setCityId: setStoreCityId,
    setPhone,
    setCustomerId,
    setAddressId,
    setPromocode,
  } = useOrderStore();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const { data: cities, city: selectedCity, cityId } = useOrderCreationCity(city);
  const [promoDescription, setPromoDescription] = useState<string | null>(null);
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [customerCreateOpen, setCustomerCreateOpen] = useState(false);
  const [customerStatus, setCustomerStatus] = useState<string | null>(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const lookupRequest = useRef(0);

  useEffect(() => {
    if (!selectedCity) return;
    setStoreCityId(selectedCity.id);
    if (selectedCity.name !== city) setCity(selectedCity.name);
  }, [city, selectedCity, setCity, setStoreCityId]);

  useEffect(() => () => {
    lookupRequest.current += 1;
  }, []);

  const handlePhoneChange = (value: string) => {
    lookupRequest.current += 1;
    setPhone(value);
    setCustomerId(null);
    setAddressId(null);
    setCustomerStatus(null);
    setCustomerLookupLoading(false);
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    const phoneSnapshot = phone.trim();
    const citySnapshot = cityId;
    const requestId = ++lookupRequest.current;
    setCustomerId(null);
    setAddressId(null);
    setCustomerStatus(null);
    if (phoneSnapshot) {
      setCustomerLookupLoading(true);
      void customerApi.lookup(phoneSnapshot, citySnapshot ?? undefined).then((result) => {
        if (requestId !== lookupRequest.current || phoneSnapshot !== useOrderStore.getState().phone || citySnapshot !== useOrderStore.getState().cityId) return;
        setCustomerId(result.customer?.id ?? null);
        setCustomerStatus(result.customer ? `Клиент найден: ${result.customer.name || result.customer.phone}` : 'Клиент не найден');
        const address = result.addresses.find((item) => item.cityId === citySnapshot) ?? result.addresses[0];
        setAddressId(address?.id ?? null);
        if (!result.customer) setCustomerCreateOpen(true);
      }).catch(() => {
        if (requestId !== lookupRequest.current || phoneSnapshot !== useOrderStore.getState().phone) return;
        setCustomerId(null);
        setAddressId(null);
        setCustomerStatus('Не удалось проверить клиента');
      }).finally(() => {
        if (requestId === lookupRequest.current) setCustomerLookupLoading(false);
      });
    } else {
      setCustomerLookupLoading(false);
    }
    if (!promocode.trim() || cityId === null) {
      setPromoValid(null);
      setPromoDescription(null);
      return;
    }
    void promoApi.check(promocode.trim(), cityId).then((result) => {
      setPromoValid(result.valid);
      setPromoDescription(result.promo?.text || result.promo?.conditionText || null);
    }).catch(() => {
      setPromoValid(false);
      setPromoDescription(null);
    });
  };

  const handlePromocodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromocode(e.target.value);
    setPromoValid(null);
    setPromoDescription(null);
    if (isSubmitted) setIsSubmitted(false);
  };

  const promocodeInfo = !promocode
    ? "Здесь появится информация об условиях действия промокода."
    : promoDescription
      ? promoDescription
      : "Промокод не найден";

  const promocodeError = isSubmitted && promocode && promoValid === false ? "Промокод не найден" : undefined;

  const phoneInfo = "Введите номер телефона клиента";

  return (
    <form onSubmit={handleSubmit} className="current-order__header">
      <div className="current-order__header-row">
        <SelectTown value={city} options={cities?.map((item) => item.name) ?? []} onSelect={(value) => {
          lookupRequest.current += 1;
          setCity(value);
          setCustomerId(null);
          setAddressId(null);
          setCustomerStatus(null);
          setCustomerLookupLoading(false);
          setPromoValid(null);
          setPromoDescription(null);
        }} className="current-order__header-city"/>

        <div className="current-order__header-phone">
          <InputPhone
            value={phone}
            onChange={handlePhoneChange}
            placeholder="999 999-99-99"
          />
          {customerStatus && <span className="current-order__header-customer-status" role="status">{customerStatus}</span>}
          <Tooltip content={phoneInfo} placement="bottom">
            <button type="button" className="current-order__header-info-btn" aria-label="Информация">
              <Image src="/icons/info-base.svg" alt="" width={20} height={20} />
            </button>
          </Tooltip>
        </div>

        <Button type="submit" variant="base" theme="primary" className="current-order__header-button" disabled={customerLookupLoading} aria-busy={customerLookupLoading}>
          {customerLookupLoading ? "Проверка…" : "Найти"}
        </Button>
      </div>
      <CustomerCreateModal
        phone={phone}
        cityId={cityId ?? 0}
        isOpen={customerCreateOpen}
        onClose={() => setCustomerCreateOpen(false)}
        onCreated={(result: CustomerCreateResult) => {
          setCustomerId(result.customer.id);
          setCustomerStatus(`Клиент добавлен: ${result.customer.name}`);
          setCustomerCreateOpen(false);
        }}
      />

      <div className="current-order__header-promocode">
        <div className="current-order__header-promocode-input">
          <Input
            value={promocode}
            onChange={handlePromocodeChange}
            placeholder="Промокод"
            error={promocodeError}
          />
          {promocode && (<ClearButton onClick={() => setPromocode("")} className="top-[2px] right-0"/>)}
        </div>
        <div className="current-order__header-info">
          <Text variant="label-s-regular-12" className="current-order__header-info-text">
            {promocodeInfo}
          </Text>
          <Tooltip content={promocodeInfo} placement="bottom">
            <button type="button" className="current-order__header-info-btn" aria-label="Информация">
              <Image src="/icons/info-base.svg" alt="" width={20} height={20} />
            </button>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}

const ClearButton = ({ onClick, className="" }: { onClick: () => void; className?: string }) => (
  <button type="button" className={`absolute flex items-center justify-center cursor-pointer w-10 h-10 ${className}`} onClick={onClick}>
    <Image src="/icons/button-delete.svg" alt="Очистить" width={14} height={14}/>
  </button>
);
