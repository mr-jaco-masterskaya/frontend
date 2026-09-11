export type PointCity = {
  id: number;
  name: string;
};

export type Point = {
  id: number;
  cityId: number;
  city: PointCity | null;
  name: string;
  address: string;
  base: string;
  latitude: number | null;
  longitude: number | null;
};
