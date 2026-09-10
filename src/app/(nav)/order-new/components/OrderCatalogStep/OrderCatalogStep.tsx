import { InputSearch } from "@/features/InputSearch/ui/InputSearch/InputSearch"
import { CardsDish } from "@/widgets/CardsDish/ui/CardsDish"
import { Categories } from "@/widgets/Categories/ui/Categories/Categories"
import { useOrderStore } from "@/entities/Order/store/new-order/orderStore"
import { useMemo, useState } from "react"
import { useOrderCreationCatalogQuery, useOrderCreationCitiesQuery } from "@/entities/order-creation/api/orderCreationQueries"
import { mapCatalogCategories, mapCatalogDishes } from "@/entities/order-creation/model/catalogView"
import { Text } from "@/shared/ui/Typography/Typography"

export const OrderCatalogStep = () => {
  const addItem = useOrderStore((s) => s.addItem);
  const city = useOrderStore((s) => s.city);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const citiesQuery = useOrderCreationCitiesQuery();
  const cityId = citiesQuery.data?.find((item) => item.name === city)?.id ?? citiesQuery.data?.[0]?.id ?? null;
  const catalogQuery = useOrderCreationCatalogQuery(cityId);
  const categories = useMemo(() => catalogQuery.data?.categories.map(mapCatalogCategories) ?? [], [catalogQuery.data]);
  const catalogDishes = useMemo(() => catalogQuery.data ? mapCatalogDishes(catalogQuery.data) : [], [catalogQuery.data]);
  const loading = citiesQuery.isLoading || catalogQuery.isLoading;
  const error = citiesQuery.error ?? catalogQuery.error;

  const filteredDishes = catalogDishes.filter((d) => {
    const matchesCategory = selectedCategory ? d.categoryId === selectedCategory : true;
    const matchesSearch = searchQuery ? d.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  const dishes = filteredDishes.map((d) => ({
    ...d,
    onClick: () => addItem({ id: d.id, name: d.name, price: d.price }),
  }));

  const handleCategorySelect = (id: string | number) => {
    const categoryId = String(id);
    setSelectedCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  return (
    <>
      {loading ? <Text>Загрузка каталога…</Text> : error ? <Text>{error instanceof Error ? error.message : "Не удалось загрузить каталог"}</Text> : <Categories items={categories} selectedId={selectedCategory} onSelect={handleCategorySelect} />}
      <div className="current-order__search">
        <InputSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Поиск товара"
        />
      </div>
      <div className="current-order__cards"><CardsDish dishes={dishes} /></div>
    </>
  )
}
