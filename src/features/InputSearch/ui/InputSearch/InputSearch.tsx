"use client";

import { Input } from "@/shared/ui/Input/Input";
import { Text } from "@/shared/ui/Typography/Typography";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { OptionItem, SearchInputProps } from "./InputSearch.type";

export const InputSearch = <T extends OptionItem>({
  options = [],
  value: controlledValue,
  placeholder = "Поиск товара",
  onChange,
  onSelect,
}: SearchInputProps<T>) => {
  const [internalValue, setInternalValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const value = controlledValue ?? internalValue;
  const showSuggestions = Boolean(onSelect) && options.length > 0;

  const filtered = options.filter((item) =>
    item.name.toLowerCase().includes(value.toLowerCase()),
  );

  const updateValue = (next: string) => {
    if (controlledValue === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  const handleSelect = (item: T) => {
    onSelect?.(item);
    updateValue("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || !isOpen) return;

    if (e.key === "ArrowDown") {
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    }

    if (e.key === "ArrowUp") {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter" && activeIndex >= 0) {
      handleSelect(filtered[activeIndex]);
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;
    const activeItem = listRef.current.children[activeIndex] as HTMLElement;
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div ref={rootRef} onKeyDown={handleKeyDown} className="relative">
      <div className="relative rounded-xl bg-bg-base-light text-text-secondary">
        <Image
          src="/icons/search.svg"
          alt=""
          width={16}
          height={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
        />
        <Input
          value={value}
          onChange={(e) => {
            updateValue(e.target.value);
            if (showSuggestions) {
              setIsOpen(true);
              setActiveIndex(-1);
            }
          }}
          onFocus={() => {
            if (showSuggestions && value) setIsOpen(true);
          }}
          placeholder={placeholder}
          style={{paddingLeft: '32px'}}
          className="h-11 rounded-full border-transparent bg-transparent pl-10 pr-3 hover:border-transparent focus:border-transparent focus:ring-0"
        />
      </div>

      {showSuggestions && isOpen && value && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 z-10 mt-1 max-h-[216px] overflow-auto rounded-xl bg-base p-2 text-text-secondary shadow-[0_4px_4px_rgba(60,59,59,0.16)]"
        >
          {filtered.map((item, index) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className={`flex h-10 cursor-pointer items-center rounded-lg px-2 ${
                activeIndex === index
                  ? "bg-bg-base-light text-text-base"
                  : "hover:bg-bg-base-light"
              }`}
            >
              <Text>{item.name}</Text>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
