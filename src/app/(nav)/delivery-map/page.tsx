"use client";
import { Map } from "./components/Map/Map";
import { CafeList } from "./components/CafeList/CafeList";
import { useEffect, useMemo, useState } from "react";
import { useMapStore } from "@/entities/map/store/mapStore/mapStore";
import { useOrderStore } from "@/entities/Order/store/new-order/orderStore";
import { citiesApi } from "@/entities/city/api/citiesApi";
import { pointsApi } from "@/entities/point/api/pointsApi";
import { deliveryApi } from "@/entities/delivery/api/deliveryApi";
import type { City } from "@/entities/city/model/types";
import type { Point } from "@/entities/point/model/types";
import type { DeliveryZone } from "@/entities/delivery/model/types";
import { mapPointToCafe, mapZonesToMapZones } from "./data/apiAdapters";
import type { CafePoint } from "./data/constants";
import { Text } from "@/shared/ui/Typography/Typography";

export default function DeliveryMapPage() {
  const resetMap = useMapStore((s) => s.resetMap);
  const cityName = useOrderStore((state) => state.city);
  const deliveryType = useOrderStore((state) => state.deliveryType);
  const delivery = useOrderStore((state) => state.delivery);
  const pickup = useOrderStore((state) => state.pickup);
  const setCity = useOrderStore((state) => state.setCity);
  const [cities, setCities] = useState<City[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCity = cities.find((city) => city.name === cityName) ?? cities[0];

  useEffect(() => {
    resetMap();
  }, [resetMap]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    citiesApi.list()
      .then((result) => {
        if (cancelled) return;
        setCities(result);
        if (result.length && !result.some((city) => city.name === cityName)) {
          setCity(result[0].name);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить города");
      });
    return () => { cancelled = true; };
  }, [cityName, setCity]);

  useEffect(() => {
    if (!selectedCity) {
      setPoints([]);
      setZones([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([pointsApi.list(selectedCity.id), deliveryApi.zones(selectedCity.id, { includeStreets: false })])
      .then(([nextPoints, nextZones]) => {
        if (cancelled) return;
        setPoints(nextPoints);
        setZones(nextZones);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Не удалось загрузить точки доставки");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedCity?.id]);

  const cafes: CafePoint[] = useMemo(() => points.map(mapPointToCafe), [points]);
  const mapZones = useMemo(() => mapZonesToMapZones(zones), [zones]);

  return (
    <div className="flex flex-1 justify-end min-h-0 gap-3">
      <Map
        cafes={cafes}
        deliveryZones={mapZones}
        acceptedAddress={deliveryType === 'delivery' && delivery.addressCheckStatus === 'success' && delivery.coordinates
          ? { address: delivery.address, coords: delivery.coordinates }
          : null}
        selectedPickupAddress={deliveryType === 'pickup' ? pickup.cafe : null}
      />
      {error && !cities.length ? (
        <div className="flex h-full w-[354px] items-center justify-center rounded-xl bg-base px-4 text-center">
          <Text className="text-accent">{error}</Text>
        </div>
      ) : (
        <CafeList cities={cities} cafes={cafes} loading={loading} error={error} />
      )}
    </div>
  );
}
