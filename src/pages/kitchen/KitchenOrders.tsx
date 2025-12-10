import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, ArrowRight } from "lucide-react";
import { joinHotelRoom, socket } from "@/lib/socket";
import { updateOrderStatusApi, getLiveOrdersApi } from "@/api/orderApi";
import { toast } from "sonner";
import { startAlertSound, stopAlertSound } from "@/lib/sound";
import { Order, OrderCreatedEvent } from "@/types/order";

export default function KitchenOrders() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const hotelId = user.hotel_id;

  const [orders, setOrders] = useState<any[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  // ---------------------------------------------------------------
  // AUTOPLAY FIX (IMPORTANT)
  // ---------------------------------------------------------------
  useEffect(() => {
    const enableSound = () => {
      const tmp = new Audio();
      tmp.play().catch(() => {});
      window.removeEventListener("click", enableSound);
    };

    window.addEventListener("click", enableSound);

    return () => window.removeEventListener("click", enableSound);
  }, []);

  // ---------------------------------------------------------------
  // PRINT KOT FUNCTION
  // ---------------------------------------------------------------
 // ---------------------------------------------------------------
// COMPACT THERMAL-PRINTER FRIENDLY KOT PRINT
// ---------------------------------------------------------------
const printKOT = (order: any) => {
  const printWindow = window.open("", "_blank", "width=280,height=500");

  if (!printWindow) {
    alert("Please allow pop-ups for printing KOT.");
    return;
  }

  const kotHtml = `
    <html>
    <head>
      <title>KOT</title>
      <style>
        @page {
          margin: 0;
          size: auto;
        }

        body {
          font-family: monospace;
          font-size: 11px;
          margin: 0;
          padding: 0;
          width: 48mm;
          display: inline-block;
        }

        h2 {
          text-align: center;
          margin: 4px 0;
          font-size: 14px;
        }

        hr { margin: 4px 0; }

        .row {
          display: flex;
          justify-content: space-between;
        }

        .item { margin: 2px 0; }
      </style>
    </head>
    <body>

      <h2>KOT</h2>
      <hr />

      <div class="row"><b>Order:</b> <span>${order._id.slice(-4)}</span></div>
      <div class="row"><b>Table:</b> <span>${order.table_id?.name || "N/A"}</span></div>
      <div class="row"><b>Time:</b> <span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>

      <hr />
      <b>Items</b><br/>

      ${order.items
        .map(
          (item: any) => `
            <div class="item row">
              <span>${item.qty}x ${item.name}${item.size ? ` (${item.size})` : ""}</span>
            </div>
          `
        )
        .join("")}

      <hr />
      <div class="row"><b>Total:</b> <span>₹${order.total}</span></div>

      <script>
        setTimeout(() => {
          window.print();
          window.close();
        }, 200);
      </script>

    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(kotHtml);
  printWindow.document.close();
};


  // ----------------------------------------------------------------
  // SOUND STOP HELPER
  // ----------------------------------------------------------------
  const stopSoundIfNoNewOrders = (updatedOrders: any[]) => {
    const hasNew = updatedOrders.some((o) => o.status === "NEW");
    if (!hasNew) stopAlertSound();
  };

  // ----------------------------------------------------------------
  // SOCKET + INITIAL LOAD
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!hotelId) return;

    socket.off("order:created");
    socket.off("order:status_update");

    joinHotelRoom(hotelId, "KITCHEN_MANAGER");

    // NEW ORDER RECEIVED
    socket.on("order:created", (data: OrderCreatedEvent) => {
      if (!data?.order) return;

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === data.order._id);

        if (!exists) {
          startAlertSound();
          return [data.order, ...prev];
        }

        return prev.map((o) => (o._id === data.order._id ? data.order : o));
      });
    });

    // STATUS UPDATED
    socket.on("order:status_update", (order: Order) => {
      if (!order) return;

      setOrders((prev) => {
        const updated = prev.map((o) =>
          o._id === order._id ? order : o
        );
        stopSoundIfNoNewOrders(updated);
        return updated;
      });
    });

    // FETCH LIVE ORDERS
    getLiveOrdersApi(hotelId)
      .then((res) => {
        setOrders(res.orders);

        if (res.orders.some((o: any) => o.status === "NEW")) {
          startAlertSound();
        }
      })
      .catch(() => toast.error("Failed to load kitchen orders"));

    return () => {
      socket.off("order:created");
      socket.off("order:status_update");
    };
  }, [hotelId]);

  // ----------------------------------------------------------------
  // DRAG/DROP HANDLERS
  // ----------------------------------------------------------------
  const onDragStart = (orderId: string) => setDraggedOrder(orderId);

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const onDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedOrder) return;

    setOrders((prev) => {
      const updated = prev.map((o) =>
        o._id === draggedOrder ? { ...o, status: newStatus } : o
      );
      stopSoundIfNoNewOrders(updated);
      return updated;
    });

    await updateStatus(draggedOrder, newStatus);
    setDraggedOrder(null);
  };

  // ----------------------------------------------------------------
  // UPDATE STATUS (AND AUTO-PRINT)
  // ----------------------------------------------------------------
  const updateStatus = async (orderId: string, status: string) => {
    try {
      let changedOrder: any = null;

      setOrders((prev) => {
        const updated = prev.map((o) => {
          if (o._id === orderId) {
            changedOrder = { ...o, status };
            return changedOrder;
          }
          return o;
        });

        stopSoundIfNoNewOrders(updated);
        return updated;
      });

      // AUTO PRINT KOT
      const oldOrder = orders.find((o) => o._id === orderId);
      if (oldOrder?.status === "NEW" && status !== "NEW") {
        printKOT(oldOrder);
      }

      await updateOrderStatusApi(orderId, status);
    } catch {
      toast.error("Failed to update order");
    }
  };

  // UI Helpers
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

        {/* HEADER */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <ChefHat className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Orders</h1>
            <p className="text-muted-foreground">Live order tracking</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {statusFlow.map((status) => {
            const col = getColumn(status);
            const filtered = orders.filter((o) => o.status === status);

            return (
              <div
                key={status}
                className="flex flex-col"
                onDragOver={allowDrop}
                onDrop={(e) => onDrop(e, status)}
              >
                <div className={`border-l-4 border-${col.color}-500 p-4 rounded-t-lg bg-${col.color}-50`}>
                  <h3 className={`font-bold text-${col.color}-600`}>
                    {col.label}
                  </h3>
                </div>

                <div className="border p-4 min-h-[500px] rounded-b-lg space-y-4 bg-white">
                  
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center pt-4">
                      No orders
                    </p>
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
                        
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{i.name} ({i.size})</span>
                            <span>× {i.qty}</span>
                          </div>
                        ))}

                        <div className="border-t pt-2 flex justify-between font-semibold">
                          <span>Total</span>
                          <span>₹{order.total}</span>
                        </div>

                        {nextStatus(order.status) && (
                          <Button
                            className="w-full mt-2"
                            onClick={() =>
                              updateStatus(order._id, nextStatus(order.status)!)
                            }
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
