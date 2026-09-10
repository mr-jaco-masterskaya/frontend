import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/entities/catalog/api/catalogApi';
import { citiesApi } from '@/entities/city/api/citiesApi';
import type { City } from '@/entities/city/model/types';

export const orderCreationQueryKeys = {
  cities: ['order-creation', 'cities'] as const,
  catalog: (cityId: number) => ['order-creation', 'catalog', cityId] as const,
};

export function useOrderCreationCitiesQuery() {
  return useQuery({ queryKey: orderCreationQueryKeys.cities, queryFn: () => citiesApi.list() });
}

export function resolveOrderCreationCity(cities: City[] | undefined, cityName: string) {
  return cities?.find((city) => city.name === cityName) ?? cities?.[0] ?? null;
}

export function useOrderCreationCity(cityName: string) {
  const query = useOrderCreationCitiesQuery();
  const city = resolveOrderCreationCity(query.data, cityName);

  return {
    ...query,
    city,
    cityId: city?.id ?? null,
  };
}

export function useOrderCreationCatalogQuery(cityId: number | null) {
  return useQuery({
    queryKey: orderCreationQueryKeys.catalog(cityId ?? 0),
    queryFn: () => catalogApi.get(cityId as number),
    enabled: cityId !== null,
  });
}
