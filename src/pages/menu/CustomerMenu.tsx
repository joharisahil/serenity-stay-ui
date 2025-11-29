import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Hotel, CheckCircle2, Clock, ChefHat, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { getPublicMenuApi } from "@/api/publicMenuApi";
import PublicMenuSkeleton from "@/components/skeletons/PublicMenuSkeleton";
import { createPublicOrderApi } from "@/api/orderApi";
import confetti from "canvas-confetti";
import OrderTracking from "@/components/public/OrderTracking";

interface SelectedItem {
  item_id: string;
  name: string;
  size: "SINGLE" | "HALF" | "FULL";
  price: number;
  qty: number;
}

function QuantityRow({ label, price, qty, onAdd, onRemove }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-md">
      <span className="font-medium">
        {label} — ₹{price}
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

        <span className="w-6 text-center">{qty}</span>

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


export default function CustomerMenu() {
  const { source, id, hotelId } = useParams();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [step, setStep] = useState<"menu" | "order-placed">("menu");
  const [orderStatus, setOrderStatus] =
    useState<"preparing" | "coming-to-table" | "received">("preparing");

  const [orderId, setOrderId] = useState("");


  useEffect(() => {
  const activeOrderId = localStorage.getItem("activeOrderId");
  const activeHotelId = localStorage.getItem("activeOrderHotelId");

  if (activeOrderId && activeHotelId) {
    setOrderId(activeOrderId);
    setStep("order-placed");
  }
}, []);


  // ---------------------------
  // Load menu from backend
  // ---------------------------
useEffect(() => {
  const loadMenu = async () => {
    try {
      const data = await getPublicMenuApi(source!, id!, hotelId!);

      if (!data.success) throw new Error("Failed to load menu");

      setCategories(data.menu.categories);
      setItems(data.menu.items);

    } catch (err) {
      toast.error("Unable to load menu");
    } finally {
      setLoading(false);
    }
  };

  loadMenu();
}, [source, id, hotelId]);

  // ---------------------------
  // Toggle selection
  // ---------------------------
const addItem = (item: any, size: "SINGLE" | "HALF" | "FULL", price: number) => {
  const existing = selectedItems.find(
    (s) => s.item_id === item._id && s.size === size
  );

  if (existing) {
    existing.qty += 1;
    setSelectedItems([...selectedItems]);
  } else {
    setSelectedItems([
      ...selectedItems,
      {
        item_id: item._id,
        name: item.name,
        size,
        price,
        qty: 1,
      },
    ]);
  }
};

const removeItem = (itemId: string, size: string) => {
  const existing = selectedItems.find(
    (s) => s.item_id === itemId && s.size === size
  );

  if (!existing) return;

  if (existing.qty === 1) {
    // remove completely
    setSelectedItems(selectedItems.filter(
      (s) => !(s.item_id === itemId && s.size === size)
    ));
  } else {
    existing.qty -= 1;
    setSelectedItems([...selectedItems]);
  }
};

const getQty = (itemId: string, size: string) => {
  const found = selectedItems.find(
    (s) => s.item_id === itemId && s.size === size
  );
  return found?.qty || 0;
};

const [scrolled, setScrolled] = useState(false);

useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 10);
  window.addEventListener("scroll", onScroll);
  return () => window.removeEventListener("scroll", onScroll);
}, []);


  const isSelected = (itemId: string, size: string) =>
    selectedItems.some((s) => s.item_id === itemId && s.size === size);

  // ---------------------------
  // Compute summary
  // ---------------------------
const subtotal = selectedItems.reduce((sum, it) => sum + it.price * it.qty, 0);
  const gst = +(subtotal * 0.05).toFixed(2);
  const total = subtotal + gst;

  // ---------------------------
  // Place Order (calls backend)
  // ---------------------------
const handlePlaceOrder = async () => {
  try {
    const payload = {
      hotel_id: hotelId,
      source: source.toUpperCase(), // QR, TABLE, ROOM
      table_id: source === "table" ? id : undefined,
      room_id: source === "room" ? id : undefined,
      items: selectedItems.map((s) => ({
        item_id: s.item_id,
        size: s.size,
        qty: s.qty,
      })),
    };

    const data = await createPublicOrderApi(payload);

    if (!data.success) throw new Error("Failed to place order");

localStorage.setItem("orderReturnUrl", window.location.pathname);


    setOrderId(data.order._id);
    setStep("order-placed");

    // Zomato style live status animation
setTimeout(() => setOrderStatus("coming-to-table"), 2000);
setTimeout(() => setOrderStatus("received"), 2000);

// confetti trigger
setTimeout(() => {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
  });
}, 2000);


    toast.success("Order placed successfully!");

  } catch (err: any) {
    toast.error(err?.response?.data?.message || "Failed to place order");
  }
};


  const statusConfig = {
    preparing: { label: "Preparing Your Order", icon: ChefHat, color: "text-orange-500" },
    "coming-to-table": { label: "Coming Soon", icon: Package, color: "text-blue-500" },
    received: { label: "Order Received", icon: CheckCircle2, color: "text-green-500" },
  };

  // ---------------------------
  // Loading UI
  // ---------------------------
if (loading) return <PublicMenuSkeleton />;


  // ---------------------------
  // Order placed screen
  // ---------------------------
if (step === "order-placed") {
  return <OrderTracking orderId={orderId} hotelId={hotelId} />;
}


  // ---------------------------
  // Menu UI
  // ---------------------------
return (
  <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4 pb-32">
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
{/* HEADER – transparent, shadow only when scrolling */}
<div
  className={`
    flex items-center gap-3 sticky top-0 py-4 z-30 transition-all
    ${scrolled ? "bg-background/70 backdrop-blur-sm shadow-sm" : "bg-transparent"}
  `}
>
  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-primary shadow">
    <Hotel className="text-primary-foreground h-6 w-6" />
  </div>

  <div>
    <h1 className="text-2xl font-bold">Order from Menu</h1>
    <p className="text-sm text-muted-foreground">
 <p>
  {source === "table" && `Table ${id}`}
  {source === "room" && `Room ${id}`}
</p>

    </p>
  </div>
</div>

      {/* CATEGORY SELECTOR */}
      <div className="flex gap-3 overflow-x-scroll no-scrollbar sticky top-20 bg-background py-3 z-20 border-b shadow-sm">
        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => {
              document.getElementById(`cat-${cat._id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="
              px-4 py-2 rounded-full border text-sm whitespace-nowrap
              hover:bg-primary hover:text-white transition-all
            "
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* MENU SECTIONS */}
      {categories.map((cat) => (
        <div key={cat._id} id={`cat-${cat._id}`} className="scroll-mt-24">
          
          <h2 className="text-xl font-bold text-primary mt-6 mb-4">
            {cat.name}
          </h2>

          <div className="space-y-4">
            {items
              .filter((it) => it.category_id === cat._id)
              .map((item) => {
                const prices = {
                  single: item.priceSingle,
                  half: item.priceHalf,
                  full: item.priceFull,
                };

                return (
                  <Card key={item._id} className="shadow hover:shadow-lg transition-all">
                    <CardContent className="p-5 space-y-4">

                      {/* NAME + DESCRIPTION */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="text-md">
                          ₹{prices.full ?? prices.single ?? prices.half}
                        </Badge>
                      </div>

                      {/* QUANTITY BUTTONS */}
                      <div className="space-y-3">

                        {/* SINGLE */}
                        {prices.single && (
                          <QuantityRow
                            label="Single"
                            price={prices.single}
                            qty={getQty(item._id, "SINGLE")}
                            onAdd={() => addItem(item, "SINGLE", prices.single)}
                            onRemove={() => removeItem(item._id, "SINGLE")}
                          />
                        )}

                        {/* HALF */}
                        {prices.half && (
                          <QuantityRow
                            label="Half"
                            price={prices.half}
                            qty={getQty(item._id, "HALF")}
                            onAdd={() => addItem(item, "HALF", prices.half)}
                            onRemove={() => removeItem(item._id, "HALF")}
                          />
                        )}

                        {/* FULL */}
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

      {/* SPACER */}
      <div className="h-40"></div>

      {/* FLOATING CART BUTTON */}
      {selectedItems.length > 0 && (
        <button
          onClick={() =>
            window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
          }
          className="
            fixed bottom-24 right-5 bg-primary text-white px-6 py-4 
            rounded-full shadow-xl text-lg font-semibold flex items-center gap-2 
            animate-bounce-slow z-50
          "
        >
          View Cart • ₹{total}
        </button>
      )}

      {/* BOTTOM CART SUMMARY */}
{/* BOTTOM CART SUMMARY – Modern Swiggy/Zomato style */}
{selectedItems.length > 0 && (
  <div
    className="
      fixed bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-3xl 
      border-t z-50 p-4 pb-6 transition-all
    "
  >
    <div className="max-w-4xl mx-auto space-y-3">

      {/* CART ITEMS */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {selectedItems.map((it) => (
          <div
            key={it.item_id + it.size}
            className="flex justify-between text-sm"
          >
            <span className="font-medium">
              {it.name} ({it.size.toLowerCase()}) × {it.qty}
            </span>
            <span className="font-semibold">₹{it.qty * it.price}</span>
          </div>
        ))}
      </div>

      {/* BILL SUMMARY */}
      <div className="space-y-1 text-sm pt-2 border-t">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">GST (5%)</span>
          <span>₹{gst}</span>
        </div>

        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span>₹{total}</span>
        </div>
      </div>

      {/* PLACE ORDER BUTTON (Scrolling Style) */}
      <Button
        className="
          w-full py-5 text-lg font-semibold rounded-full 
          bg-primary text-white shadow-md hover:shadow-lg
          transition-all
        "
        onClick={handlePlaceOrder}
      >
        Place Order • ₹{total}
      </Button>
    </div>
  </div>
)}

    </div>
  </div>
);

}
