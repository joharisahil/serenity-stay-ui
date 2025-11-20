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

const dummyOrders: Order[] = [
  {
    id: '1001',
    tableNumber: '5',
    items: [
      { name: 'Paneer Tikka', portion: 'full', price: 280 },
      { name: 'Butter Chicken', portion: 'full', price: 420 },
      { name: 'Fresh Juice', portion: 'full', price: 150 }
    ],
    total: 892,
    status: 'preparing',
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: '1002',
    roomNumber: '201',
    items: [
      { name: 'Dal Makhani', portion: 'full', price: 280 },
      { name: 'Biryani', portion: 'full', price: 350 },
      { name: 'Gulab Jamun', portion: 'half', price: 72 }
    ],
    total: 738,
    status: 'coming-to-table',
    timestamp: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: '1003',
    tableNumber: '12',
    items: [
      { name: 'Veg Spring Roll', portion: 'half', price: 132 },
      { name: 'Ice Cream', portion: 'full', price: 100 }
    ],
    total: 244,
    status: 'preparing',
    timestamp: new Date(Date.now() - 120000).toISOString()
  },
  {
    id: '1004',
    roomNumber: '305',
    items: [
      { name: 'Paneer Tikka', portion: 'full', price: 280 },
      { name: 'Dal Makhani', portion: 'full', price: 280 },
      { name: 'Biryani', portion: 'full', price: 350 },
      { name: 'Fresh Juice', portion: 'full', price: 150 }
    ],
    total: 1113,
    status: 'received',
    timestamp: new Date(Date.now() - 900000).toISOString()
  }
];

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadOrders = () => {
      const stored = localStorage.getItem('kitchen-orders');
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        setOrders(parsedOrders.length > 0 ? parsedOrders : dummyOrders);
      } else {
        setOrders(dummyOrders);
        localStorage.setItem('kitchen-orders', JSON.stringify(dummyOrders));
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
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4 flex flex-col" style={{ borderLeftColor: `var(--${statusConfig[order.status].color})` }}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg truncate">
                        {order.tableNumber ? `Table ${order.tableNumber}` : `Room ${order.roomNumber}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{new Date(order.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <Badge className={`${statusConfig[order.status].color} flex-shrink-0 text-xs whitespace-nowrap`}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col pt-0">
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold text-xs sm:text-sm">Order Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs sm:text-sm gap-2">
                          <span className="truncate flex-1">{item.name} ({item.portion})</span>
                          <span className="text-muted-foreground flex-shrink-0">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-semibold text-sm sm:text-base">
                      <span>Total:</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {getNextStatus(order.status) && (
                      <Button
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                      >
                        Mark as {statusConfig[getNextStatus(order.status)!].label}
                      </Button>
                    )}
                    {order.status === 'received' && (
                      <Button
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                        onClick={() => {
                          const updatedOrders = orders.filter(o => o.id !== order.id);
                          setOrders(updatedOrders);
                          localStorage.setItem('kitchen-orders', JSON.stringify(updatedOrders));
                        }}
                      >
                        Clear Order
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
