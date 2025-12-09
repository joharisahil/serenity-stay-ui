import { useEffect, useState } from "react";
import { ChefHat, Package, CheckCircle2, Clock } from "lucide-react";
import { socket, joinHotelRoom } from "@/lib/socket";
import { playSound } from "@/lib/sound";
import api from "@/api/authApi";

interface Props {
  orderId: string;
  hotelId: string;
  placeName?: string;
  source?: string; // table or room
}

export default function OrderTracking({ orderId, hotelId, placeName, source }: Props) {
  const [status, setStatus] = useState("NEW");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------
  // FETCH ORDER DETAILS
  // ------------------------------------
  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        setOrder(res.data.order);
        setStatus(res.data.order.status);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // ------------------------------------
  // PERSIST + BLOCK BACK BUTTON
  // ------------------------------------
  useEffect(() => {
    localStorage.setItem("activeOrderId", orderId);
    localStorage.setItem("activeOrderHotelId", hotelId);

    window.history.pushState(null, "", window.location.href);
    const blockBack = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBack);

    return () => window.removeEventListener("popstate", blockBack);
  }, []);

  // ------------------------------------
  // SOCKET UPDATES
  // ------------------------------------
  useEffect(() => {
    joinHotelRoom(hotelId);

    const handler = (updated: any) => {
      if (updated._id === orderId) {
        setStatus(updated.status);
        setOrder((prev: any) => ({ ...prev, status: updated.status }));

        if (updated.status === "DELIVERED") {
          playSound("/sounds/status-update.mp3");
          localStorage.removeItem("activeOrderId");
          localStorage.removeItem("activeOrderHotelId");
          localStorage.removeItem("orderReturnUrl");
        }
      }
    };

    socket.on("order:status_update", handler);
    return () => {
  socket.off("order:status_update", handler);
};

  }, []);

  // ------------------------------------
  // ORDER MORE
  // ------------------------------------
  const orderMore = () => {
    localStorage.removeItem("activeOrderId");
    localStorage.removeItem("activeOrderHotelId");

    const url = localStorage.getItem("orderReturnUrl");
    localStorage.removeItem("orderReturnUrl");

    if (url) window.location.href = url;
    else window.location.reload();
  };

  // ------------------------------------
  // UI STEPS
  // ------------------------------------
  const steps = [
    { key: "NEW", label: "Order Received", icon: Clock },
    { key: "PREPARING", label: "Preparing", icon: ChefHat },
    { key: "COMING", label: "On the Way", icon: Package },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  if (loading || !order)
    return <p className="text-center mt-10">Loading order...</p>;

  return (
    <div className="h-screen overflow-auto flex flex-col items-center p-6">

      {/* HEADER */}
      <div className="mb-4 text-center">
        <h1 className="text-3xl font-bold text-primary">Tracking Your Order</h1>

        <p className="text-muted-foreground mt-1 text-sm">
          Order #{String(orderId).slice(-6)}
        </p>

        <p className="text-lg font-semibold mt-1 text-primary/80">
          {source === "table"
            ? `Table ${placeName}`
            : `Room ${placeName}`}
        </p>

        {status !== "DELIVERED" && (
          <p className="mt-1 text-sm text-orange-600 font-medium">
            {status === "PREPARING" && "Estimated time: 20 minutes"}
            {status === "COMING" && "Arriving in 2 minutes"}
          </p>
        )}
      </div>

      {/* STATUS STEPS */}
      <div className="space-y-6 w-full max-w-md mt-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index <= currentIndex;

          return (
            <div
              key={step.key}
              className="flex items-center gap-4 p-3 rounded-xl shadow-sm border bg-white/70 backdrop-blur transition-all"
            >
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center 
                  ${active ? "bg-primary text-white scale-110" : "bg-gray-200 text-gray-500"}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <p className={`font-semibold ${active ? "text-primary" : "text-gray-500"}`}>
                  {step.label}
                </p>
                {active && index === currentIndex && status !== "DELIVERED" && (
                  <p className="text-xs text-muted-foreground animate-pulse">In progress…</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ORDER DETAILS SECTION */}
      <div className="w-full max-w-md mt-8 p-4 bg-white shadow-md rounded-xl">
        <h2 className="font-bold text-xl mb-3">Order Details</h2>

        {order.items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between py-1 border-b">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>₹{item.totalPrice}</span>
          </div>
        ))}

        <div className="flex justify-between mt-3 font-medium">
          <span>Subtotal</span>
          <span>₹{order.subtotal}</span>
        </div>

        <div className="flex justify-between mt-1">
          <span>GST</span>
          <span>₹{order.gst}</span>
        </div>

        <div className="flex justify-between mt-2 text-lg font-bold">
          <span>Total</span>
          <span>₹{order.total}</span>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          Ordered at: {new Date(order.createdAt).toLocaleString()}
        </p>
      </div>

      {/* ORDER MORE BUTTON */}
      {status !== "DELIVERED" && (
        <button
          onClick={orderMore}
          className="mt-8 bg-primary text-white px-6 py-3 rounded-full shadow-xl hover:scale-105 transition-all"
        >
          Order More
        </button>
      )}

      {status === "DELIVERED" && (
        <p className="mt-6 text-green-600 font-semibold text-lg">
          Your order has been delivered 🎉
        </p>
      )}
    </div>
  );
}
