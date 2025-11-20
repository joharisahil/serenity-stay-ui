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
  status: 'received' | 'prepared' | 'on-the-way' | 'delivered';
  timestamp: string;
}

const statusConfig = {
  received: { label: 'Order Received', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  prepared: { label: 'Order Prepared', color: 'bg-orange-500', textColor: 'text-orange-600' },
  'on-the-way': { label: 'On the Way', color: 'bg-blue-500', textColor: 'text-blue-600' },
  delivered: { label: 'Order Delivered', color: 'bg-green-500', textColor: 'text-green-600' }
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
    status: 'received',
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
    status: 'prepared',
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
    status: 'on-the-way',
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
    status: 'delivered',
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
    if (currentStatus === 'received') return 'prepared';
    if (currentStatus === 'prepared') return 'on-the-way';
    if (currentStatus === 'on-the-way') return 'delivered';
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
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id} className="border-l-4" style={{ borderLeftColor: `hsl(var(--${statusConfig[order.status].color}))` }}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Order Info */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                      {/* Location & Time */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Location</p>
                        <p className="font-semibold text-sm">
                          {order.tableNumber ? `Table ${order.tableNumber}` : `Room ${order.roomNumber}`}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(order.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      {/* Order ID */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Order ID</p>
                        <p className="font-mono text-sm font-semibold">#{order.id}</p>
                      </div>

                      {/* Items */}
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <p className="text-xs text-muted-foreground font-medium">Items</p>
                        <div className="text-sm">
                          {order.items.map((item, idx) => (
                            <div key={idx}>
                              {item.name} ({item.portion})
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total */}
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium">Total</p>
                        <p className="font-semibold text-lg">₹{order.total}</p>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-48 lg:items-stretch">
                      <Badge className={`${statusConfig[order.status].color} text-white justify-center py-2`}>
                        {statusConfig[order.status].label}
                      </Badge>
                      
                      {getNextStatus(order.status) ? (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                        >
                          Mark as {statusConfig[getNextStatus(order.status)!].label}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
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
                    </div>
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
