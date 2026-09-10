import { describe, expect, it } from "vitest";
import type { CustomerAddress } from "@/entities/customer/model/types";
import {
  addressWriteForIntercom,
  changedIntercomFields,
  intercomToDomTrue,
} from "./orderAddressPersistence";

const address = (domTrue: boolean): CustomerAddress => ({
  id: 101,
  customerId: 7,
  cityId: 2,
  cityName: "Тольятти",
  streetId: 55,
  street: "Чапаева",
  home: "47",
  apartment: "12",
  entrance: "1",
  floor: "3",
  domTrue,
  comment: "",
  isMain: false,
  xy: "",
  delivery: {
    pointId: 3,
    sumDiv: 0,
    freeDrive: true,
    payActive: true,
  },
});

describe("order address intercom persistence", () => {
  it("maps a working intercom to the legacy true flag", () => {
    expect(intercomToDomTrue("working")).toBe(true);
  });

  it("maps a non-working intercom to the legacy false flag", () => {
    expect(intercomToDomTrue("not-working")).toBe(false);
  });

  it("does not write an unspecified intercom state", () => {
    expect(intercomToDomTrue(null)).toBeUndefined();
    expect(addressWriteForIntercom(null)).toEqual({});
  });

  it("creates a true flag for a new working address", () => {
    expect(addressWriteForIntercom("working")).toEqual({ domTrue: true });
  });

  it("creates a false flag for a new non-working address", () => {
    expect(addressWriteForIntercom("not-working")).toEqual({ domTrue: false });
  });

  it("does not update a missing saved address", () => {
    expect(changedIntercomFields(undefined, "working")).toEqual({});
  });

  it("does not update when the saved value already matches", () => {
    expect(changedIntercomFields(address(true), "working")).toEqual({});
    expect(changedIntercomFields(address(false), "not-working")).toEqual({});
  });

  it("updates a saved working address when the operator reports failure", () => {
    expect(changedIntercomFields(address(true), "not-working")).toEqual({ domTrue: false });
  });

  it("updates a saved failed address when the operator reports success", () => {
    expect(changedIntercomFields(address(false), "working")).toEqual({ domTrue: true });
  });

  it("does not erase a saved value when the operator leaves the field blank", () => {
    expect(changedIntercomFields(address(true), null)).toEqual({});
    expect(changedIntercomFields(address(false), null)).toEqual({});
  });

  it("keeps unrelated saved address data out of the update payload", () => {
    expect(changedIntercomFields(address(true), "not-working")).toEqual({ domTrue: false });
    expect(changedIntercomFields(address(true), "not-working")).not.toHaveProperty("streetId");
    expect(changedIntercomFields(address(true), "not-working")).not.toHaveProperty("apartment");
  });
});

