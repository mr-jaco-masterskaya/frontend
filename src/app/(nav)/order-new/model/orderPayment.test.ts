import { describe, expect, it } from "vitest";
import { parseCashAmount, paymentDraftFields } from "./orderPayment";

describe("order payment contract", () => {
  it("uses zero when the cash amount is blank", () => {
    expect(parseCashAmount("")).toBe(0);
    expect(parseCashAmount("   ")).toBe(0);
    expect(paymentDraftFields(null, "")).toEqual({ valid: true, fields: { paymentType: 1, sdacha: 0 } });
  });

  it("trims and preserves a whole-ruble amount", () => {
    expect(parseCashAmount(" 5000 ")).toBe(5000);
    expect(paymentDraftFields("cash", " 5000 ")).toEqual({ valid: true, fields: { paymentType: 1, sdacha: 5000 } });
  });

  it("accepts zero explicitly", () => {
    expect(parseCashAmount("0")).toBe(0);
    expect(paymentDraftFields("cash", "0")).toMatchObject({ valid: true, fields: { sdacha: 0 } });
  });

  it("rejects decimals because Chef stores whole rubles", () => {
    expect(parseCashAmount("5000.50")).toBeNull();
    expect(paymentDraftFields("cash", "5000.50")).toEqual({ valid: false, message: "Введите сумму наличными целым числом рублей" });
  });

  it("rejects formatted numbers with separators", () => {
    expect(parseCashAmount("5 000")).toBeNull();
    expect(parseCashAmount("5,000")).toBeNull();
  });

  it("rejects signs and other non-numeric values", () => {
    expect(parseCashAmount("-1")).toBeNull();
    expect(parseCashAmount("+1")).toBeNull();
    expect(parseCashAmount("рубли")).toBeNull();
  });

  it("rejects unsafe integer values", () => {
    expect(parseCashAmount("9007199254740992")).toBeNull();
  });

  it("rejects card instead of silently creating a cash order", () => {
    expect(paymentDraftFields("card", "")).toEqual({ valid: false, message: "Безналичный расчёт пока недоступен для заказов колл-центра" });
    expect(paymentDraftFields("card", "5000")).toEqual({ valid: false, message: "Безналичный расчёт пока недоступен для заказов колл-центра" });
  });

  it("treats an unselected method as the legacy cash default", () => {
    expect(paymentDraftFields(null, "1000")).toEqual({ valid: true, fields: { paymentType: 1, sdacha: 1000 } });
  });

  it("does not calculate change from the order total", () => {
    expect(paymentDraftFields("cash", "5000")).toMatchObject({ valid: true, fields: { sdacha: 5000 } });
  });

  it("does not mutate the input string", () => {
    const value = " 2500 ";
    paymentDraftFields("cash", value);
    expect(value).toBe(" 2500 ");
  });

  it("returns a stable API field shape", () => {
    const result = paymentDraftFields("cash", "1200");
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(Object.keys(result.fields).sort()).toEqual(["paymentType", "sdacha"]);
    }
  });
});

