import { describe, expect, it } from "vitest";
import { emptyStateMessage } from "./TableClients.state";

describe("emptyStateMessage", () => {
  it("asks the operator for a phone number before the first lookup", () => {
    expect(emptyStateMessage({ loading: false, error: null, searched: false })).toBe(
      "Введите номер телефона клиента и нажмите «Найти»",
    );
  });

  it("reports the lookup progress", () => {
    expect(emptyStateMessage({ loading: true, error: null, searched: false })).toBe("Ищем клиента…");
  });

  it("prefers the API error over the not-found message", () => {
    expect(emptyStateMessage({ loading: false, error: "Требуется авторизация", searched: true })).toBe(
      "Требуется авторизация",
    );
  });

  it("explains an empty lookup result", () => {
    expect(emptyStateMessage({ loading: false, error: null, searched: true })).toBe(
      "Клиент с таким номером не найден",
    );
  });
});
