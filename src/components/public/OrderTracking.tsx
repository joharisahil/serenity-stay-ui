import { useEffect, useState } from "react";
import { ChefHat, Package, CheckCircle2, Clock } from "lucide-react";
import { socket, joinHotelRoom } from "@/lib/socket";

export default function OrderTracking({ orderId, hotelId }) {
  const [status, setStatus] = useState("NEW");

useEffect(() => {
  joinHotelRoom(hotelId);

  const handler = (order) => {
    if (order._id === orderId) setStatus(order.status);
  };

  socket.on("order:status_update", handler);

  return () => {
    socket.off("order:status_update", handler);
  };
}, []);


const steps = [
  { key: "NEW", label: "Order Received", icon: Clock },
  { key: "PREPARING", label: "Preparing", icon: ChefHat },
  { key: "COMING", label: "On the Way", icon: Package },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];


  const currentIndex = steps.findIndex((s) => s.key === status);

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
                className={`h-12 w-12 rounded-full flex items-center justify-center 
                transition-all 
                ${active ? "bg-primary text-white scale-110" : "bg-gray-200 text-gray-500"}`}
              >
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <p className={`font-semibold ${active ? "text-primary" : "text-gray-500"}`}>
                  {step.label}
                </p>
                {active && index === currentIndex && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    In progress…
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
