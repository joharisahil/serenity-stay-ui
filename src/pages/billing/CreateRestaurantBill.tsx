import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import debounce from "lodash.debounce";
import { ArrowLeft, Trash2 } from "lucide-react";

import { getMenuItemsApi } from "@/api/menuItemApi";
import { searchMenuItemsApi } from "@/api/menuApi";
import { createManualOrderApi } from "@/api/orderApi";
import api from "@/api/authApi";

type BillItem = {
  _id: string;
  name: string;
  variant: "single" | "half" | "full";
  qty: number;
  price: number;
};

export default function CreateRestaurantBill() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tableId = params.get("tableId");

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ------------------------------------
   * START / ENSURE TABLE SESSION
   * ----------------------------------*/
  useEffect(() => {
    if (!tableId) {
      toast.error("Invalid table");
      navigate("/billing");
      return;
    }

    api.post(`/tables/${tableId}/start-session`).catch(() => {
      toast.error("Failed to start table session");
    });
  }, [tableId]);

  /* ------------------------------------
   * LOAD MENU
   * ----------------------------------*/
  useEffect(() => {
    (async () => {
      setLoadingMenu(true);
      const items = await getMenuItemsApi();
      setMenuItems(items);
      setLoadingMenu(false);
    })();
  }, []);

  /* ------------------------------------
   * SEARCH MENU
   * ----------------------------------*/
  const debouncedSearch = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!value.trim()) {
          const items = await getMenuItemsApi();
          setMenuItems(items);
        } else {
          const items = await searchMenuItemsApi(value.trim());
          setMenuItems(items);
        }
      }, 300),
    []
  );

  /* ------------------------------------
   * BILL ITEMS LOGIC
   * ----------------------------------*/
  const addToBill = (item: any, variant: BillItem["variant"], price: number) => {
    setBillItems((prev) => {
      const found = prev.find(
        (b) => b._id === item._id && b.variant === variant
      );

      if (found) {
        return prev.map((b) =>
          b === found ? { ...b, qty: b.qty + 1 } : b
        );
      }

      return [
        ...prev,
        {
          _id: item._id,
          name: item.name,
          variant,
          qty: 1,
          price,
        },
      ];
    });
  };

  const removeItem = (id: string, variant: string) => {
    setBillItems((prev) =>
      prev.filter((i) => !(i._id === id && i.variant === variant))
    );
  };

  const increaseQty = (id: string, variant: string) => {
    setBillItems((prev) =>
      prev.map((i) =>
        i._id === id && i.variant === variant
          ? { ...i, qty: i.qty + 1 }
          : i
      )
    );
  };

  const decreaseQty = (id: string, variant: string) => {
    setBillItems((prev) =>
      prev
        .map((i) =>
          i._id === id && i.variant === variant
            ? { ...i, qty: i.qty - 1 }
            : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const subtotal = billItems.reduce((s, i) => s + i.qty * i.price, 0);

  /* ------------------------------------
   * CREATE MANUAL ORDER
   * ----------------------------------*/
const submitOrder = async () => {
  if (!billItems.length) {
    toast.error("No items added");
    return;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.hotel_id) {
    toast.error("Invalid session");
    return;
  }

  setSubmitting(true);
  try {
    const res = await createManualOrderApi({
      hotel_id: user.hotel_id,
      source: "MANUAL",
      table_id: tableId,
      items: billItems.map((i) => ({
        item_id: i._id,
        qty: i.qty,
        size: i.variant.toUpperCase(),
      })),
    });

    if (!res?.success) {
      toast.error(res?.message || "Failed to place order");
      return;
    }

    toast.success("Order sent to kitchen");
    setBillItems([]);
  } catch (err) {
    toast.error("Failed to place order");
  } finally {
    setSubmitting(false);
  }
};


  /* ------------------------------------
   * KOT PRINT (UNCHANGED)
   * ----------------------------------*/
  const printKOT = () => {
    if (!billItems.length) {
      toast.error("No items to print KOT");
      return;
    }

    const w = window.open("", "_blank", "width=280,height=500");
    if (!w) return;

    w.document.write(`
      <html>
      <body style="font-family:monospace;font-size:12px;">
        <h3>KOT</h3>
        <hr/>
        ${billItems
          .map(
            (i) =>
              `<div>${i.qty} x ${i.name} (${i.variant.toUpperCase()})</div>`
          )
          .join("")}
        <hr/>
        <script>
          window.print();
          window.close();
        </script>
      </body>
      </html>
    `);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/billing")}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl font-bold">Table Order</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MENU */}
          <Card className="lg:col-span-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-semibold">Menu</h2>
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    debouncedSearch(e.target.value);
                  }}
                  className="w-48"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loadingMenu
                  ? [...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-gray-100 animate-pulse rounded"
                      />
                    ))
                  : menuItems.map((item) => (
                      <div
                        key={item._id}
                        className="border rounded p-3 space-y-2"
                      >
                        <p className="font-semibold">{item.name}</p>

                        {item.priceSingle && (
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() =>
                              addToBill(item, "single", item.priceSingle)
                            }
                          >
                            Single ₹{item.priceSingle}
                          </Button>
                        )}

                        {item.priceHalf && (
                          <Button
                            className="w-full"
                            variant="outline"
                            onClick={() =>
                              addToBill(item, "half", item.priceHalf)
                            }
                          >
                            Half ₹{item.priceHalf}
                          </Button>
                        )}

                        {item.priceFull && (
                          <Button
                            className="w-full"
                            onClick={() =>
                              addToBill(item, "full", item.priceFull)
                            }
                          >
                            Full ₹{item.priceFull}
                          </Button>
                        )}
                      </div>
                    ))}
              </div>
            </CardContent>
          </Card>

          {/* CART */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-xl font-semibold">Current Order</h2>

              {billItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No items added
                </p>
              )}

              {billItems.map((i) => (
                <div
                  key={i._id + i.variant}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">
                      {i.name} ({i.variant})
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Button size="sm" onClick={() => decreaseQty(i._id, i.variant)}>-</Button>
                      <span>{i.qty}</span>
                      <Button size="sm" onClick={() => increaseQty(i._id, i.variant)}>+</Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>₹{(i.qty * i.price).toFixed(2)}</span>
                    <Trash2
                      className="cursor-pointer text-red-500"
                      onClick={() => removeItem(i._id, i.variant)}
                    />
                  </div>
                </div>
              ))}

              <div className="border-t pt-2 font-semibold">
                Subtotal: ₹{subtotal.toFixed(2)}
              </div>

              <Button
                className="w-full bg-blue-600"
                onClick={printKOT}
              >
                🧾 Print KOT
              </Button>

              <Button
                className="w-full bg-green-600"
                disabled={submitting}
                onClick={submitOrder}
              >
                {submitting ? "Sending..." : "Send to Kitchen"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  navigate(`/billing/restaurant/${tableId}`)
                }
              >
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
