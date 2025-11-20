import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";

interface OrderItem {
  name: string;
  portion: string;
  price: number;
}

interface Order {
  id: string;
  tableNumber?: string;
  roomNumber?: string;
  items: OrderItem[];
  total: number;
  status: 'preparing' | 'coming-to-table' | 'received';
  timestamp: string;
}

const statusConfig = {
  preparing: { label: 'Preparing', color: 'bg-orange-500' },
  'coming-to-table': { label: 'Coming to Table/Room', color: 'bg-blue-500' },
  received: { label: 'Order Received', color: 'bg-green-500' }
};

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = () => {
      const stored = localStorage.getItem('kitchen-orders');
      if (stored) {
        setOrders(JSON.parse(stored));
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 2000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    localStorage.setItem('kitchen-orders', JSON.stringify(updatedOrders));
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    if (currentStatus === 'preparing') return 'coming-to-table';
    if (currentStatus === 'coming-to-table') return 'received';
    return null;
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
            <p className="text-muted-foreground">Manage and track all orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No active orders</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4" style={{ borderLeftColor: `var(--${statusConfig[order.status].color})` }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {order.tableNumber ? `Table ${order.tableNumber}` : `Room ${order.roomNumber}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(order.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge className={statusConfig[order.status].color}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm">Order Items:</p>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} ({item.portion})</span>
                        <span className="text-muted-foreground">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                  {getNextStatus(order.status) && (
                    <Button
                      className="w-full"
                      onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                    >
                      Mark as {statusConfig[getNextStatus(order.status)!].label}
                    </Button>
                  )}
                  {order.status === 'received' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const updatedOrders = orders.filter(o => o.id !== order.id);
                        setOrders(updatedOrders);
                        localStorage.setItem('kitchen-orders', JSON.stringify(updatedOrders));
                      }}
                    >
                      Clear Order
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
