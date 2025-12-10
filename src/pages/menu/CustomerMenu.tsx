import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Hotel, CheckCircle2, ChefHat, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { getPublicMenuApi, startQrSessionApi } from "@/api/publicMenuApi";
import { createPublicOrderApi } from "@/api/orderApi";

import PublicMenuSkeleton from "@/components/skeletons/PublicMenuSkeleton";
import OrderTracking from "@/components/public/OrderTracking";

// ---------------------------------------------
// Quantity Component
// ---------------------------------------------
function QuantityRow({ label, price, qty, onAdd, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md shadow-sm">
      <span className="font-medium">
        {label} • ₹{price}
      </span>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0"
          onClick={onRemove}
          disabled={qty === 0}
        >
          -
        </Button>

        <span className="w-6 text-center font-semibold text-primary">
          {qty}
        </span>

        <Button
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onAdd}
        >
          +
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------
export default function CustomerMenu() {
  const { source, id, hotelId } = useParams();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [orderId, setOrderId] = useState("");
  const [step, setStep] = useState("menu");
  const [placeName, setPlaceName] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [sessionToken, setSessionToken] = useState("");


  const [filterType, setFilterType] = useState<"all" | "veg" | "nonveg">("all");

  // Load existing order (persisted)
  useEffect(() => {
    // If user clicked "Order More", orderReturnUrl will exist but activeOrderId should be removed
    const activeId = localStorage.getItem("activeOrderId");
    const activeHotel = localStorage.getItem("activeOrderHotelId");

    if (activeId && activeHotel) {
      setOrderId(activeId);
      setStep("order-placed");
    } else {
      // 👇 IMPORTANT FIX: Go back to menu
      setStep("menu");
    }
  }, []);


// ---------------------------------------------
// Load Menu + Session Handling (PATCHED)
// ---------------------------------------------
useEffect(() => {
  const init = async () => {
    try {
      const localToken = localStorage.getItem("qrSessionToken");

      // ❌ If QR session was cleared after delivery → block reorder
      if (!localToken) {
        toast.error("QR expired! Please scan again.");
        setLoading(false);
        return;
      }

      // Use existing token (do NOT create new session)
      setSessionToken(localToken);

      // Load menu normally
      const data = await getPublicMenuApi(source!, id!, hotelId!);

      if (!data.success) {
        toast.error("Invalid QR. Please rescan.");
        return;
      }

      setCategories(data.menu.categories);
      setItems(data.menu.items);

      if (data.meta) {
        setPlaceName(data.meta.name || data.meta.number || id);
      }

    } catch (err) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const startFirstSession = async () => {
    try {
      // 1️⃣ Create first session ONLY when qrSessionToken does NOT exist
      const session = await startQrSessionApi(source!, id!, hotelId!);

      const token = session.sessionToken;
      localStorage.setItem("qrSessionToken", token);
      setSessionToken(token);

      // 2️⃣ Load menu
      const data = await getPublicMenuApi(source!, id!, hotelId!);

      if (!data.success) {
        toast.error("Invalid QR. Please rescan.");
        return;
      }

      setCategories(data.menu.categories);
      setItems(data.menu.items);

      if (data.meta) {
        setPlaceName(data.meta.name || data.meta.number || id);
      }

    } catch (err) {
      toast.error("Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  // If already placed order → show tracking screen
  if (localStorage.getItem("activeOrderId")) return;

  // ⭐ Decide whether session should be created or reused
  const localToken = localStorage.getItem("qrSessionToken");

  if (!localToken) {
    // 🟢 First scan → start new session
    startFirstSession();
  } else {
    // 🔵 Page refresh → DO NOT create new session
    init();
  }
}, []);


  // ---------------------------------------------
  // Add/Remove Items
  // ---------------------------------------------
  const addItem = (item, size, price) => {
    const existing = selectedItems.find(
      (x) => x.item_id === item._id && x.size === size
    );

    if (existing) {
      existing.qty += 1;
      setSelectedItems([...selectedItems]);
    } else {
      setSelectedItems([
        ...selectedItems,
        { item_id: item._id, name: item.name, size, price, qty: 1 }
      ]);
    }
  };

  const removeItem = (id, size) => {
    const found = selectedItems.find(
      (x) => x.item_id === id && x.size === size
    );

    if (!found) return;

    if (found.qty === 1) {
      setSelectedItems(
        selectedItems.filter((x) => !(x.item_id === id && x.size === size))
      );
    } else {
      found.qty -= 1;
      setSelectedItems([...selectedItems]);
    }
  };

  const getQty = (id, size) => {
    return selectedItems.find((x) => x.item_id === id && x.size === size)?.qty || 0;
  };

  const subtotal = selectedItems.reduce(
    (sum, it) => sum + it.price * it.qty, 0
  );

  const gst = +(subtotal * 0.05).toFixed(2);
  const total = subtotal + gst;

  // ---------------------------------------------
  // Place Order
  // ---------------------------------------------
  const placeOrder = async () => {
    try {
      setPlacingOrder(true);
      const body = {
        hotel_id: hotelId,
        source: source.toUpperCase(),
        table_id: source === "table" ? id : undefined,
        room_id: source === "room" ? id : undefined,
        sessionToken, 
        items: selectedItems.map((i) => ({
          item_id: i.item_id,
          size: i.size,
          qty: i.qty,
        }))
      };

      const data = await createPublicOrderApi(body);
      if (!data.success) {
    if (data.message?.includes("QR session expired")) {
      toast.error("QR expired! Please rescan the QR code.");
      window.location.reload(); // force user to rescan
      return;
    }
    throw new Error();
  }

      confetti({ particleCount: 100, spread: 60 });

      setOrderId(data.order._id);
      setStep("order-placed");

    } catch {
      toast.error("Failed to place order");
    } finally {
      setPlacingOrder(false);  // stop loader
    }
  };

  // ---------------------------------------------
  // UI: Loading
  // ---------------------------------------------
  if (loading) return <PublicMenuSkeleton />;

  // ---------------------------------------------
  // UI: Tracking
  // ---------------------------------------------
  if (step === "order-placed")
    return (
      <OrderTracking
        orderId={orderId}
        hotelId={hotelId}
        placeName={placeName}
        source={source}
      />
    );


  // ---------------------------------------------
  // UI: MAIN MENU
  // ---------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 p-4 pb-40">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* -------------------------------------------
            BEAUTIFUL HEADER
        ------------------------------------------- */}
        <div className="
          sticky top-0 z-50 py-4 flex items-center gap-3
          backdrop-blur-lg bg-white/70 border-b shadow-sm
        ">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary shadow">
            <Hotel className="text-white h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold">Order Delicious Food</h1>
            <p className="text-sm text-muted-foreground">
              {placeName
                ? (source === "table" ? `Table: ${placeName}` : `Room: ${placeName}`)
                : (source === "table" ? `Table ${id}` : `Room ${id}`)}

            </p>
          </div>
        </div>

        {/* -------------------------------------------
            FILTER: VEG / NON-VEG
        ------------------------------------------- */}
        <div className="flex gap-3 sticky top-20 bg-white/90 backdrop-blur-md py-3 z-40 shadow">
          <Button variant={filterType === "all" ? "default" : "outline"} onClick={() => setFilterType("all")}>
            All
          </Button>
          <Button variant={filterType === "veg" ? "default" : "outline"} onClick={() => setFilterType("veg")}>
            🟢 Veg
          </Button>
          <Button variant={filterType === "nonveg" ? "default" : "outline"} onClick={() => setFilterType("nonveg")}>
            🔴 Non-Veg
          </Button>
        </div>

        {/* -------------------------------------------
            CATEGORY PILLS
        ------------------------------------------- */}
        <div className="flex gap-3 overflow-x-scroll no-scrollbar sticky top-36 bg-white/90 py-3 z-40 shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() =>
                document.getElementById(`cat-${cat._id}`)?.scrollIntoView({ behavior: "smooth" })
              }
              className="
                px-4 py-2 rounded-full bg-gray-100 hover:bg-primary 
                hover:text-white transition font-medium whitespace-nowrap
              "
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* -------------------------------------------
            MENU SECTIONS
        ------------------------------------------- */}
        {categories.map((cat) => (
          <div key={cat._id} id={`cat-${cat._id}`} className="scroll-mt-28">
            <h2 className="text-xl font-bold text-primary mt-8 mb-4">
              {cat.name}
            </h2>

            <div className="space-y-4">
              {items
                .filter((it) => it.category_id === cat._id)
                .filter((it) =>
                  filterType === "veg" ? it.isVeg :
                    filterType === "nonveg" ? !it.isVeg : true
                )
                .map((item) => {
                  const prices = {
                    single: item.priceSingle,
                    half: item.priceHalf,
                    full: item.priceFull,
                  };

                  return (
                    <Card className="shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
                      <CardContent className="p-5 space-y-4">

                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{item.name}</h3>

                              {item.isVeg ? (
                                <span className="text-green-600">🟢</span>
                              ) : (
                                <span className="text-red-600">🔴</span>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {item.description || ""}
                            </p>
                          </div>

                          <Badge className="text-md px-3 py-1">
                            ₹{prices.full ?? prices.single ?? prices.half}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {prices.single && (
                            <QuantityRow
                              label="Single"
                              price={prices.single}
                              qty={getQty(item._id, "SINGLE")}
                              onAdd={() => addItem(item, "SINGLE", prices.single)}
                              onRemove={() => removeItem(item._id, "SINGLE")}
                            />
                          )}

                          {prices.half && (
                            <QuantityRow
                              label="Half"
                              price={prices.half}
                              qty={getQty(item._id, "HALF")}
                              onAdd={() => addItem(item, "HALF", prices.half)}
                              onRemove={() => removeItem(item._id, "HALF")}
                            />
                          )}

                          {prices.full && (
                            <QuantityRow
                              label="Full"
                              price={prices.full}
                              qty={getQty(item._id, "FULL")}
                              onAdd={() => addItem(item, "FULL", prices.full)}
                              onRemove={() => removeItem(item._id, "FULL")}
                            />
                          )}
                        </div>

                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="h-40"></div>
      </div>

      {/* -------------------------------------------
          FLOATING CART
      ------------------------------------------- */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-5 shadow-xl rounded-t-3xl border-t z-50">
          <div className="max-w-4xl mx-auto space-y-4">

            {/* CART LIST */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedItems.map((it) => (
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {it.name} ({it.size}) × {it.qty}
                  </span>

                  <span className="font-semibold">₹{it.qty * it.price}</span>
                </div>
              ))}
            </div>

            {/* SUMMARY */}
            <div className="text-sm border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>GST</span>
                <span>₹{gst}</span>
              </div>

              <div className="flex justify-between pt-2 font-bold text-lg">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>

            {/* BUTTON */}
            <Button
              onClick={placeOrder}
              className="w-full py-5 text-lg font-semibold rounded-full"
              disabled={placingOrder}
            >
              {placingOrder ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                <>Place Order • ₹{total}</>
              )}
            </Button>


          </div>
        </div>
      )}

    </div>
  );
}
