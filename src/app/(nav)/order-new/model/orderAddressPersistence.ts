import type { CustomerAddress, CustomerAddressInput } from "@/entities/customer/model/types";

export type IntercomState = "working" | "not-working" | null;

/**
 * Converts the operator's intercom choice to the legacy address flag.
 * `dom_true` is persisted on user_saved_addr and later copied to orders.fake_dom.
 */
export function intercomToDomTrue(intercom: IntercomState): boolean | undefined {
  if (intercom === null) return undefined;
  return intercom === "working";
}

export function addressWriteForIntercom(intercom: IntercomState): Pick<CustomerAddressInput, "domTrue"> {
  const domTrue = intercomToDomTrue(intercom);
  return domTrue === undefined ? {} : { domTrue };
}

/**
 * Returns only the fields that must be updated when an existing saved address
 * is reused for a new order. The API owns the rest of the address record.
 */
export function changedIntercomFields(
  address: CustomerAddress | undefined,
  intercom: IntercomState,
): Pick<CustomerAddressInput, "domTrue"> {
  const domTrue = intercomToDomTrue(intercom);
  if (!address || domTrue === undefined || address.domTrue === domTrue) return {};
  return { domTrue };
}

