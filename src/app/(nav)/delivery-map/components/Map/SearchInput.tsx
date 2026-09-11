"use client";
import React from "react";
import Image from "next/image";
import type { LngLat, SuggestResponse } from "ymaps3";
import { Input } from "@/shared/ui/Input/Input";
import { SearchInputProps } from "./SearchInput.types";
import { Text } from "@/shared/ui/Typography/Typography";
import { DELIVERY_BOUNDS, SAMARA_REGION } from "../../data/constants";

const HOUSE_NUMBER_REGEX = /,\s*\d+/;

export const SearchInput = ({
  selectedAddress,
  initialAddress,
  onSelectAddress,
  externalError,
  className = "",
}: SearchInputProps) => {
  const [query, setQuery] = React.useState(initialAddress ?? "");
  const [suggestions, setSuggestions] = React.useState<SuggestResponse>([]);
  const [internalError, setInternalError] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const suggestIdRef = React.useRef(0);
  const geocodeIdRef = React.useRef(0);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setInternalError(null);
    clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setSuggestions([]);
      onSelectAddress(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++suggestIdRef.current;
      try {
        const results = await ymaps3.suggest({
          text: value,
          bounds: DELIVERY_BOUNDS,
        });
        if (requestId !== suggestIdRef.current) return;

        const filtered = results.filter(
          (item) =>
            item.uri?.startsWith("ymapsbm1://geo") &&
            item.subtitle?.text?.includes(SAMARA_REGION),
        );
        setSuggestions(filtered);
      } catch (error) {
        if (requestId === suggestIdRef.current) {
          console.error("Suggest failed:", error);
          setSuggestions([]);
        }
      }
    }, 300);
  };

  const handleSelect = async (item: SuggestResponse[number]) => {
    const address = item.title.text;
    const fullText = [address, item.subtitle?.text].filter(Boolean).join(", ");

    setQuery(address);
    setSuggestions([]);
    onSelectAddress(null);

    if (!HOUSE_NUMBER_REGEX.test(address)) {
      setInternalError("Укажите номер дома");
      return;
    }

    const requestId = ++geocodeIdRef.current;
    try {
      const geocoded = await ymaps3.search({
        text: fullText,
        bounds: DELIVERY_BOUNDS,
      });
      if (requestId !== geocodeIdRef.current) return;

      const coords = geocoded[0]?.geometry?.coordinates as LngLat | undefined;
      if (!coords) {
        setInternalError("Адрес не найден");
        return;
      }

      onSelectAddress({ coords, address });
    } catch (error) {
      if (requestId !== geocodeIdRef.current) return;
      console.error("Search failed:", error);
      setInternalError("Не удалось проверить адрес. Попробуйте ещё раз");
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setInternalError(null);
    onSelectAddress(null);
  };

  return (
    <div className={className}>
      <div ref={containerRef} className="relative w-full">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Введите адрес"
          helperText={selectedAddress && !externalError  && !internalError ? "Адрес входит в зону доставки" : undefined}
          error={externalError ?? internalError ?? undefined}
          className="relative bg-bg-base-light border-none h-11 !pl-8"
        />
        <Image
          src="/icons/search.svg"
          alt="Поиск"
          width={16}
          height={16}
          className="absolute left-2 top-[14px]"
        />
        {query && (
          <button
            type="button"
            className="right-1 top-[2px] cursor-pointer h-10 w-10 flex items-center justify-center absolute"
            onClick={handleClear}
          >
            <Image
              src="/icons/button-delete.svg"
              alt="Очистить"
              width={14}
              height={14}
            />
          </button>
        )}

        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 max-h-72 overflow-y-auto rounded-xl bg-base py-2 shadow-[0px_4px_4px_0px_#3C3B3B29]">
            {suggestions.map((item, index) => (
              <li
                key={index}
                onMouseDown={() => handleSelect(item)}
                className="cursor-pointer px-4 py-2 hover:bg-bg-base-light"
              >
                <Text className="text-text-secondary">{item.title.text}</Text>
                {item.subtitle?.text && (
                  <Text className="text-text-secondary opacity-60">
                    , {item.subtitle.text}
                  </Text>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
