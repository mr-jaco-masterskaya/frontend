"use client";

import * as React from "react";
import type { YMapLocationRequest, YMap as YMapType, LngLat, LngLatBounds } from "ymaps3";
import { ReactifiedApi } from "./Map.types";
import { ZoomControls } from "./ZoomControls";
import {
  COLORS,
  DEFAULT_ZOOM,
  ZOOM_RANGE,
  defaultLocation,
  type CafePoint,
  type DeliveryZone,
} from "../../data/constants";
import { CafeMarker } from "./CafeMarker";
import { SearchInput } from "./SearchInput";
import { SearchMarker } from "./SearchMarker";
import { SearchResult } from "./SearchInput.types";
import { useMapStore } from "@/entities/map/store/mapStore/mapStore";
import { loadYmaps3 } from "@/lib/ymaps3";
import { Text } from "@/shared/ui/Typography/Typography";

type MapProps = {
  cafes: CafePoint[];
  deliveryZones: DeliveryZone[];
  acceptedAddress?: { address: string; coords: LngLat } | null;
  selectedPickupAddress?: string | null;
};

const apiKey = process.env.NEXT_PUBLIC_YMAPS_API_KEY ?? "";

export const Map = ({ cafes, deliveryZones, acceptedAddress = null, selectedPickupAddress = null }: MapProps) => {
  const [reactifiedApi, setReactifiedApi] = React.useState<ReactifiedApi>();
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const mapRef = React.useRef<YMapType | null>(null);
  const [locationOverride, setLocationOverride] = React.useState<{
    boundsKey: string;
    location: YMapLocationRequest;
  } | null>(null);

  const dataBounds = React.useMemo<LngLatBounds | undefined>(() => {
    const coordinates = [
      ...cafes.flatMap((cafe) => cafe.coordinates ? [cafe.coordinates] : []),
      ...deliveryZones.flatMap((zone) => zone.coordinates.flat()),
    ];
    if (coordinates.length === 0) return undefined;

    const longitudes = coordinates.map(([longitude]) => longitude);
    const latitudes = coordinates.map(([, latitude]) => latitude);
    const padding = 0.02;

    return [
      [Math.min(...longitudes) - padding, Math.min(...latitudes) - padding],
      [Math.max(...longitudes) + padding, Math.max(...latitudes) + padding],
    ];
  }, [cafes, deliveryZones]);

  const boundsKey = JSON.stringify(dataBounds ?? null);
  const selectedPickup = cafes.find((cafe) => cafe.address === selectedPickupAddress);
  const location = locationOverride?.boundsKey === boundsKey
    ? locationOverride.location
    : acceptedAddress ? { center: acceptedAddress.coords, zoom: DEFAULT_ZOOM }
      : selectedPickup?.coordinates ? { center: selectedPickup.coordinates, zoom: DEFAULT_ZOOM }
        : dataBounds ? { bounds: dataBounds } : defaultLocation;

  const searchResult = useMapStore((s) => s.searchResult);
  const selectedCafeId = useMapStore((s) => s.selectedCafeId);
  const setSearchResult = useMapStore((s) => s.setSearchResult);
  const toggleCafe = useMapStore((s) => s.toggleCafe);
  const selectCafe = useMapStore((s) => s.selectCafe);
  const effectiveSelectedCafeId = selectedCafeId ?? selectedPickup?.id ?? null;
  const mapSearchResult = searchResult ?? acceptedAddress;

  React.useEffect(() => {
    let cancelled = false;

    loadYmaps3(apiKey)
      .then((modules) => {
        if (!cancelled) {
          setReactifiedApi(modules as ReactifiedApi);
          setLoadError(null);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("YMaps error:", error);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить карту",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const changeZoom = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    setLocationOverride({
      boundsKey,
      location: {
        center: map.center as LngLat,
        zoom: Math.min(
          Math.max(map.zoom + delta, ZOOM_RANGE.min),
          ZOOM_RANGE.max,
        ),
        duration: 200,
      },
    });
  };

  const handleSearchResult = (result: SearchResult | null) => {
    if (!result) {
      setSearchResult(null);
      selectCafe(null);
      return;
    }

    setSearchResult({
      ...result,
      // The API supplies street coverage, not polygon geometry. Address
      // validation remains the source of truth until polygon data is exposed.
      inDeliveryZone: null,
      cafeId: null,
    });
    selectCafe(null);

    setLocationOverride({
      boundsKey,
      location: {
        center: result.coords,
        zoom: DEFAULT_ZOOM,
        duration: 400,
      },
    });
  };

  if (loadError) {
    return (
      <div className="relative flex h-full w-full min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl bg-bg-base-light px-6 text-center">
        <Text variant="body-m-medium-16" className="text-text-base">
          Карта недоступна
        </Text>
        <Text variant="body-m-regular-16" className="text-text-secondary">
          {loadError}
        </Text>
        {!apiKey && (
          <Text variant="label-s-regular-12" className="text-text-secondary">
            Добавьте ключ в `.env.local`: NEXT_PUBLIC_YMAPS_API_KEY=…
          </Text>
        )}
      </div>
    );
  }

  if (!reactifiedApi) {
    return (
      <div className="relative flex h-full w-full min-w-0 items-center justify-center overflow-hidden rounded-xl bg-bg-base-light">
        <Text variant="body-m-regular-16" className="text-text-secondary">
          Загрузка карты…
        </Text>
      </div>
    );
  }

  const {
    YMap,
    YMapDefaultSchemeLayer,
    YMapDefaultFeaturesLayer,
    YMapFeature,
    YMapMarker,
  } = reactifiedApi;

  const isOutOfZone = searchResult?.inDeliveryZone === false;

  return (
    <div className="relative h-full w-full min-w-0 overflow-hidden rounded-xl">
      <SearchInput
        selectedAddress={searchResult ?? acceptedAddress}
        initialAddress={acceptedAddress?.address}
        onSelectAddress={handleSearchResult}
        externalError={isOutOfZone ? "Адрес вне зоны доставки" : null}
        className="absolute top-3 left-3 right-3 z-10"
      />
      <YMap ref={mapRef} location={location} zoomRange={ZOOM_RANGE}>
        <YMapDefaultSchemeLayer />
        <YMapDefaultFeaturesLayer />

        {mapSearchResult && (
          <YMapMarker coordinates={mapSearchResult.coords}>
            <SearchMarker
              address={mapSearchResult.address}
              inDeliveryZone={searchResult?.inDeliveryZone === true || acceptedAddress !== null}
            />
          </YMapMarker>
        )}

        {deliveryZones.filter((zone) => zone.coordinates.length > 0).map((zone) => {
          const color =
            zone.cafeId === effectiveSelectedCafeId ? COLORS.selected : COLORS.default;
          return (
            <YMapFeature
              key={zone.id}
              geometry={{ type: "Polygon", coordinates: zone.coordinates }}
              onClick={() => toggleCafe(zone.cafeId)}
              style={{
                fill: color.fill,
                stroke: [{ width: 2, color: color.stroke }],
                cursor: "pointer",
              }}
            />
          );
        })}

        {cafes.filter((cafe) => cafe.coordinates).map((cafe) => {
          if (!cafe.coordinates) return null;
          return (
          <YMapMarker
            key={cafe.id}
            coordinates={cafe.coordinates}
            onClick={() => toggleCafe(cafe.id)}
          >
            <CafeMarker cafe={cafe} isSelected={cafe.id === effectiveSelectedCafeId} />
          </YMapMarker>
          );
        })}
      </YMap>
      <ZoomControls
        onZoomIn={() => changeZoom(1)}
        onZoomOut={() => changeZoom(-1)}
        className="absolute left-3 top-1/2 z-10 -translate-y-1/2"
      />
    </div>
  );
};
