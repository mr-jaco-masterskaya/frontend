import type { LngLat } from "ymaps3";

export type SearchResult = {
  coords: LngLat;
  address: string;
};

export type SearchInputProps = {
  selectedAddress: SearchResult | null;
  initialAddress?: string;
  onSelectAddress: (result: SearchResult | null) => void;
  externalError?: string | null;
  className?: string;
};
