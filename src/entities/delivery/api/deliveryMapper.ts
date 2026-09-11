import type { AddressValidation, City, DeliveryCoordinate, DeliveryPolygon, DeliveryStreet, DeliveryZone, Point, PreorderSlots } from '@/entities/delivery/model/types';
export type CityDto = { id: number; name?: string }; export type PointDto = { id: number; city_id: number; name?: string; base?: string; address?: string; latitude?: number | null; longitude?: number | null };
export type StreetDto = { id: number; point_id: number; zone_id?: number; name?: string; home?: string; xy?: string; delivery?: { sum_div?: number; free_drive?: boolean } };
export type GeometryDto = { type?: string; coordinates?: unknown };
export type ZoneDto = { id?: number; point_id: number; point_name?: string; streets?: StreetDto[]; geometry?: GeometryDto | unknown; coordinates?: unknown }; export type ValidationDto = { valid?: boolean; city_id?: number; street?: string; home?: string; entrance?: string; street_id?: number; point_id?: number; sum_div?: number; free_drive?: boolean; latitude?: number | null; longitude?: number | null; code?: string };
export type PolygonDto = { zone_id: number; point_id: number; coordinates?: unknown };
export type SlotDto = { start?: string | null; end?: string | null; value?: string | number; disabled?: boolean; label?: string }; export type SlotsDto = { valid?: boolean; date?: string; point_id: number; type_order: number; code?: string; slots?: SlotDto[] };
export const mapCity = (value: CityDto): City => ({ id: Number(value.id), name: String(value.name ?? '') });
export const mapPoint = (value: PointDto): Point => ({ id: Number(value.id), cityId: Number(value.city_id), name: String(value.name ?? ''), base: String(value.base ?? ''), address: String(value.address ?? ''), latitude: value.latitude == null ? null : Number(value.latitude), longitude: value.longitude == null ? null : Number(value.longitude) });
export const mapStreet = (value: StreetDto): DeliveryStreet => ({ id: Number(value.id), pointId: Number(value.point_id), zoneId: value.zone_id == null ? undefined : Number(value.zone_id), name: String(value.name ?? ''), home: String(value.home ?? ''), xy: String(value.xy ?? ''), delivery: value.delivery ? { sumDiv: Number(value.delivery.sum_div ?? 0), freeDrive: Boolean(value.delivery.free_drive) } : undefined });
const isCoordinate = (value: unknown): value is DeliveryCoordinate => Array.isArray(value) && value.length >= 2 && Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));
const mapRing = (value: unknown): DeliveryCoordinate[] => {
  if (!Array.isArray(value) || value.length < 4 || !value.every(isCoordinate)) return [];
  return value.map((coordinate) => [Number(coordinate[0]), Number(coordinate[1])]);
};

/** Accept only GeoJSON Polygon coordinates; malformed or absent data is empty. */
export const mapZoneCoordinates = (value: unknown): DeliveryPolygon => {
  const coordinates = value && typeof value === 'object' && !Array.isArray(value) && 'coordinates' in value
    ? (value as { coordinates?: unknown }).coordinates
    : value;
  if (!Array.isArray(coordinates)) return [];
  return coordinates.map(mapRing).filter((ring) => ring.length >= 4);
};

export const mapZone = (value: ZoneDto): DeliveryZone => ({ id: value.id == null ? undefined : Number(value.id), pointId: Number(value.point_id), pointName: String(value.point_name ?? ''), streets: (value.streets ?? []).map(mapStreet), coordinates: mapZoneCoordinates(value.geometry ?? value.coordinates) });
export const mapPolygon = (value: PolygonDto): { zoneId: number; pointId: number; coordinates: DeliveryPolygon } => ({ zoneId: Number(value.zone_id), pointId: Number(value.point_id), coordinates: mapZoneCoordinates(value.coordinates) });
export const mapValidation = (value: ValidationDto): AddressValidation => ({ valid: Boolean(value.valid), cityId: value.city_id == null ? undefined : Number(value.city_id), street: value.street, home: value.home, entrance: value.entrance, streetId: value.street_id == null ? undefined : Number(value.street_id), pointId: value.point_id == null ? undefined : Number(value.point_id), sumDiv: value.sum_div == null ? undefined : Number(value.sum_div), freeDrive: value.free_drive == null ? undefined : Boolean(value.free_drive), latitude: value.latitude == null ? null : Number(value.latitude), longitude: value.longitude == null ? null : Number(value.longitude), code: value.code });
export const mapSlots = (value: SlotsDto): PreorderSlots => ({ valid: Boolean(value.valid), date: String(value.date ?? ''), pointId: Number(value.point_id), typeOrder: Number(value.type_order), code: value.code, slots: (value.slots ?? []).map((slot) => ({ start: slot.start == null ? null : String(slot.start), end: slot.end == null ? null : String(slot.end), value: slot.value === undefined ? '' : slot.value, disabled: Boolean(slot.disabled), label: slot.label })) });
