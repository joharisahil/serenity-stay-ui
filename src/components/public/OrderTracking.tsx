import { useEffect, useState } from "react";
import { ChefHat, Package, CheckCircle2, Clock } from "lucide-react";
import { socket, joinHotelRoom } from "@/lib/socket";

interface Props {
  orderId: string;
  hotelId: string;
}

export default function OrderTracking({ orderId, hotelId }: Props) {
  const [status, setStatus] = useState("NEW");

  // ------------------------------------
  // PERSIST PAGE + BLOCK BACK NAVIGATION
  // ------------------------------------
  useEffect(() => {
    // Save order tracking so page refresh still shows this screen
    localStorage.setItem("activeOrderId", orderId);
    localStorage.setItem("activeOrderHotelId", hotelId);

    // Block back button
    window.history.pushState(null, "", window.location.href);

    const blockBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", blockBack);

    return () => {
      window.removeEventListener("popstate", blockBack);
    };
  }, [orderId, hotelId]);

  // ------------------------------------
  // SOCKET: LISTEN FOR STATUS UPDATES
  // ------------------------------------
  useEffect(() => {
    joinHotelRoom(hotelId);

    const handler = (order: any) => {
      if (order._id === orderId) {
        setStatus(order.status);

        // Clear saved tracking once delivered
        if (order.status === "DELIVERED") {
          localStorage.removeItem("activeOrderId");
          localStorage.removeItem("activeOrderHotelId");
          localStorage.removeItem("orderReturnUrl");
        }
      }
    };

    socket.on("order:status_update", handler);

    return () => {
      socket.off("order:status_update", handler); // correct cleanup
    };
  }, [orderId, hotelId]);

  // ------------------------------------
  // ORDER STEPS
  // ------------------------------------
  const steps = [
    { key: "NEW", label: "Order Received", icon: Clock },
    { key: "PREPARING", label: "Preparing", icon: ChefHat },
    { key: "COMING", label: "On the Way", icon: Package },
    { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentIndex = steps.findIndex((s) => s.key === status);

  // ------------------------------------
  // ORDER MORE FUNCTION
  // ------------------------------------
const orderMore = () => {
  localStorage.removeItem("activeOrderId");
  localStorage.removeItem("activeOrderHotelId");

  const url = localStorage.getItem("orderReturnUrl");

  if (url) window.location.href = url;
};


  return (
    <div className="h-screen flex flex-col justify-center items-center p-6">
      <h1 className="text-2xl font-bold mb-4">Tracking Your Order</h1>
      <p className="text-muted-foreground mb-6">Order #{orderId}</p>

      <div className="space-y-6 w-full max-w-md">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const active = index <= currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-4">
              <div
                className={`
                  h-12 w-12 rounded-full flex items-center justify-center 
                  transition-all duration-300
                  ${active ? "bg-primary text-white scale-110" : "bg-gray-200 text-gray-500"}
                `}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <p className={`font-semibold ${active ? "text-primary" : "text-gray-500"}`}>
                  {step.label}
                </p>

                {active && index === currentIndex && status !== "DELIVERED" && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    In progress…
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ORDER MORE BUTTON */}
      {status !== "DELIVERED" && (
        <button
          onClick={orderMore}
          className="mt-10 bg-primary text-white px-6 py-3 rounded-full shadow-lg"
        >
          Order More
        </button>
      )}

      {/* MESSAGE WHEN DELIVERED */}
      {status === "DELIVERED" && (
        <p className="mt-6 text-green-600 font-medium">
          Your order has been delivered 🎉
        </p>
      )}
    </div>
  );
}
