import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL } from "@/shared/config/api";
import { ordersApi } from "./ordersApi";

afterEach(() => vi.unstubAllGlobals());

describe("ordersApi details", () => {
  it("keeps type_order_addr_new for order and kitchen detail modals", async () => {
    const order = {
      id: 42,
      type_order_addr_new: "г. Самара, Ленина 10, Пд.: 2, Эт.: 3, Кв.: 4",
    };
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ st: true, data: order }), { status: 200 }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(ordersApi.show(42, 7)).resolves.toMatchObject({
      data: { type_order_addr_new: order.type_order_addr_new },
    });
    await expect(ordersApi.kitchenShow(42)).resolves.toMatchObject({
      data: { type_order_addr_new: order.type_order_addr_new },
    });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${API_BASE_URL}/orders/42?point_id=7`,
      `${API_BASE_URL}/kitchen/orders/42`,
    ]);
  });
});
