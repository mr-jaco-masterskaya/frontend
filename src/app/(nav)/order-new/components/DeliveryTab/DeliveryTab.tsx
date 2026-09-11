import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/shared/ui/Button/Button";
import { Input } from "@/shared/ui/Input/Input";
import { Text } from "@/shared/ui/Typography/Typography";
import { DeliveryTabProps } from "./DeliveryTab.types";
import "./DeliveryTab.style.css";
import { useOrderStore } from "@/entities/Order/store/new-order/orderStore";
import { useRouter } from "next/navigation";
import { deliveryApi } from "@/entities/delivery/api/deliveryApi";
import { useOrderCreationCity } from "@/entities/order-creation/api/orderCreationQueries";

export const DeliveryTab = ({ activeTimeTab, setActiveTimeTab }: DeliveryTabProps ) => {
  const delivery = useOrderStore((s) => s.delivery);
  const setDelivery = useOrderStore((s) => s.setDelivery);
  const setAddressId = useOrderStore((s) => s.setAddressId);

  const { address, building, entrance, floor, apartment, intercom, addressCheckStatus } = delivery;
  const city = useOrderStore((s) => s.city);
  const { cityId } = useOrderCreationCity(city);
  const [validating, setValidating] = useState(false);

  const buildingRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const updateVisibleAddress = (value: Parameters<typeof setDelivery>[0]) => {
    setDelivery(value);
    setAddressId(null);
  };

  useEffect(() => {
  if (addressCheckStatus === "success") {
      buildingRef.current?.focus();
    }
  }, [addressCheckStatus]);

  const validateAddress = async () => {
    const parsedAddress = splitStreetAndHome(address);
    if (!parsedAddress || cityId === null) {
      setDelivery({ addressCheckStatus: "error" });
      return;
    }
    setValidating(true);
    try {
      const result = await deliveryApi.validateAddress({ cityId, street: parsedAddress.street, home: parsedAddress.home, entrance: entrance.trim() || undefined });
      setDelivery({
        addressCheckStatus: result.valid ? "success" : "error",
        streetId: result.streetId ?? null,
        pointId: result.pointId ?? null,
      });
      if (result.valid && activeTimeTab === null) setActiveTimeTab("nearest");
    } catch {
      setDelivery({ addressCheckStatus: "error" });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div>
      <div className="delivery-container">
        <div className="delivery-address group">
          <Input 
            value={address} 
            onChange={(e) => 
              updateVisibleAddress({
                address: e.target.value,
                addressCheckStatus: null,
                streetId: null,
                pointId: null,
                cafeId: null,
              })
            } 
            label="Улица, дом"
            placeholder="Введите улицу, дом"
            helperText={addressCheckStatus === "success" ? "Адрес входит в зону доставки" : ""}
            error={addressCheckStatus === "error" ? "Адрес вне зоны доставки. Введите другой адрес" : ""}
            className="placeholder:ps-6"
          />
          {!address && <Image src="/icons/search.svg" alt="Поиск" width={20} height={20} className="icon-search"/>}
  {address && <ClearButton onClick={() => updateVisibleAddress({ address: "", addressCheckStatus: null, streetId: null, pointId: null, cafeId: null, })} className="right-1 top-[24px]"/>}
        </div>
        <div className="delivery-buttons-group">
          <Button 
            variant="base" 
            theme={address && !addressCheckStatus && !validating ? "primary" : "secondary"}
            size="sm" 
            onClick={() => void validateAddress()}
            disabled={validating}
          >
            <Text>Найти</Text>
          </Button>
          <Button variant="icon" theme="secondary" size="icon-sm" onClick={() => router.push('/delivery-map')}>
            <Image src="/icons/map-primary.svg" alt="Карта" width={14} height={20} className="icon-map"/>
          </Button>
        </div>
      </div>
      <div className="delivery-address-details">
        <Input 
          type="text"
          ref={buildingRef}
          value={building}
          onChange={(e) => updateVisibleAddress({ building: e.target.value })}
          label="Корпус"
          placeholder="___" 
          className="delivery-address-details-input"/>
        <Input 
          type="number"
          value={entrance} 
          onChange={(e) => updateVisibleAddress({ entrance: e.target.value })}
          label="Подъезд" 
          placeholder="___"  
          className="delivery-address-details-input"/>
        <Input  
          type="number"
          value={floor} 
          onChange={(e) => updateVisibleAddress({ floor: e.target.value })}
          label="Этаж" 
          placeholder="___"  
          className="delivery-address-details-input"/>
        <Input 
          type="number"
          value={apartment} 
          onChange={(e) => updateVisibleAddress({ apartment: e.target.value })}
          label="Квартира" 
          placeholder="___" 
          className="delivery-address-details-input"/>
      </div>
      <div>
        <Text variant="label-s-regular-12" className="intercom-label">Домофон</Text>
        <div className="intercom-buttons">
          <Button 
            variant="base" 
            theme={intercom === "working" ? "primary" : "secondary"} 
            size="md"
            onClick={() => {
              setDelivery({ intercom: "working" });
              if (activeTimeTab === null) setActiveTimeTab("nearest");
            }}
            className={intercom === "working" ? "button-active" : "button-default"}
          >
            <Text>Работает</Text>
          </Button>
          <Button 
            variant="base" 
            theme={intercom === "not-working" ? "primary" : "secondary"} 
            size="md"
            onClick={() => {
              setDelivery({ intercom: "not-working" });
              if (activeTimeTab === null) setActiveTimeTab("nearest");
            }}
            className={intercom === "not-working" ? "button-active" : "button-default"}
          >
            <Text>Не работает</Text>
          </Button>
        </div>
      </div>
    </div>
)};

function splitStreetAndHome(value: string): { street: string; home: string } | null {
  const normalized = value.trim().replace(/,\s*$/, '');
  const match = normalized.match(/^(.+?)[,\s]+(\d+[А-Яа-яA-Za-z]?(?:[/-]\d+[А-Яа-яA-Za-z]?)?)$/);
  if (!match) return null;
  const street = match[1].trim().replace(/,\s*$/, '').trim();
  return street ? { street, home: match[2] } : null;
}

const ClearButton = ({ onClick, className="" }: { onClick: () => void; className?: string }) => (
  <button type="button" className={`clear-button ${className}`} onClick={onClick}>
    <Image src="/icons/button-delete.svg" alt="Очистить" width={14} height={14}/>
  </button>
);
