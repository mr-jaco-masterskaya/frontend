"use client";
import { useSearchFormStore } from "@/entities/client/store/searchForm/searchForm";
import { InputPhone } from "@/features/Inputs/ui/InputPhone/InputPhone";
import { Button } from "@/shared/ui/Button/Button";
import { Text } from "@/shared/ui/Typography/Typography";
import React from "react";

export const SearchForm = () => {
  const { phone, searched, loading, error, setPhone, foundClientId, search } = useSearchFormStore();

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    void search();
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 w-[352px]">
      <div className="w-[264px] h-16">
        <InputPhone
          value={phone}
          withSearchIcon
          onChange={setPhone}
          error={searched && (foundClientId === null || error !== null) ? (error ?? "Клиент с таким номером не найден") : undefined}
          helperText={ foundClientId !== null ? "Клиент есть в базе" : undefined }
        />
      </div>

      <Button type="submit" variant="base" theme={phone.length === 10 && !searched && !loading ? "primary" : "secondary"} size="sm" disabled={loading}>
        <Text variant="body-m-medium-16">{loading ? "Поиск…" : "Найти"}</Text>
      </Button>
    </form>
  );
};
