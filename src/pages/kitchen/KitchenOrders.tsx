import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, ArrowRight } from "lucide-react";
import { joinHotelRoom, socket } from "@/lib/socket";
import { updateOrderStatusApi, getLiveOrdersApi } from "@/api/orderApi";
import { toast } from "sonner";
import { playSound } from "@/lib/sound";
import { Order, OrderCreatedEvent } from "@/types/order";

export default function KitchenOrders() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hotelId = user.hotel_id;
  console.log("KITCHEN HOTEL ID:", hotelId);

  const [orders, setOrders] = useState<any[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!hotelId) return;

    socket.off("order:created");
    socket.off("order:status_update");

    joinHotelRoom(hotelId, "KITCHEN_MANAGER");

    socket.on("order:created", (data: OrderCreatedEvent) => {
      if (!data?.order) return;
      setOrders((prev) => [data.order, ...prev]);
    });


    socket.on("order:status_update", (order: Order) => {
      if (!order) return;
      setOrders((prev) => prev.map((o) => (o._id === order._id ? order : o)));
    });


    getLiveOrdersApi(hotelId)
      .then((res) => setOrders(res.orders))
      .catch(() => toast.error("Failed to load kitchen orders"));

    return () => {
      socket.off("order:created");
      socket.off("order:status_update");
    };
  }, [hotelId]);
  // When dragging starts
  const onDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  // Allows drop
  const allowDrop = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // When dropped into a column
  const onDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedOrder) return;

    await updateStatus(draggedOrder, newStatus);
    setDraggedOrder(null);
  };


  const updateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatusApi(orderId, status);
    } catch {
      toast.error("Failed to update order");
    }
  };

  const statusFlow = ["NEW", "PREPARING", "COMING", "DELIVERED"];

  const getColumn = (status: string) => {
    const config = {
      NEW: { label: "New Orders", color: "yellow" },
      PREPARING: { label: "Preparing", color: "orange" },
      COMING: { label: "On the Way", color: "blue" },
      DELIVERED: { label: "Delivered", color: "green" },
    };
    return config[status];
  };

  const nextStatus = (status: string) => {
    const i = statusFlow.indexOf(status);
    return statusFlow[i + 1] || null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Orders</h1>
            <p className="text-muted-foreground">Live order tracking</p>
          </div>
        </div>

        {/* KANBAN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {statusFlow.map((status) => {
            const col = getColumn(status);
            const filtered = orders
              .filter((o) => o && o.status) // <- prevent crash
              .filter((o) => o.status === status);


            return (
              <div
                key={status}
                className="flex flex-col"
                onDragOver={allowDrop}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className={`border-l-4 border-${col.color}-500 p-4 rounded-t-lg bg-${col.color}-50`}>
                  <h3 className={`font-bold text-${col.color}-600`}>{col.label}</h3>
                </div>

                <div className="border p-4 min-h-[500px] rounded-b-lg space-y-4 bg-white">
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">No orders</p>
                  )}

                  {filtered.map((order) => (
                    <Card
                      key={order._id}
                      draggable
                      onDragStart={() => onDragStart(order._id)}
                      className="shadow-md cursor-move"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="flex justify-between">
                          <span className="font-bold">
                            {order.table_id?.name
                              ? `Table ${order.table_id.name}`
                              : order.room_id?.number
                                ? `Room ${order.room_id.number}`
                                : "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            #{order._id.slice(-4)}
                          </span>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="space-y-1 text-sm">
                          {order.items.map((i, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{i.name} ({i.size})</span>
                              <span>× {i.qty}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₹{order.total}</span>
                        </div>

                        {nextStatus(order.status) && (
                          <Button
                            className="w-full mt-2"
                            onClick={() => updateStatus(order._id, nextStatus(order.status)!)}
                          >
                            Move to {getColumn(nextStatus(order.status)!).label}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

            );
          })}
        </div>
      </div>
    </Layout>
  );
}
