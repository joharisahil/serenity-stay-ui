import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, ArrowRight } from "lucide-react";
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
  received: { 
    label: 'Order Received', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-600',
    bgLight: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  prepared: { 
    label: 'Order Prepared', 
    color: 'bg-orange-500', 
    textColor: 'text-orange-600',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  'on-the-way': { 
    label: 'On the Way', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-600',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  delivered: { 
    label: 'Order Delivered', 
    color: 'bg-green-500', 
    textColor: 'text-green-600',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200'
  }
};

const statusOrder: Order['status'][] = ['received', 'prepared', 'on-the-way', 'delivered'];

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

const migrateOrderStatus = (oldStatus: string): Order['status'] => {
  // Map old status values to new ones
  const statusMap: Record<string, Order['status']> = {
    'preparing': 'received',
    'coming-to-table': 'on-the-way',
    'received': 'delivered'
  };
  return statusMap[oldStatus] || (oldStatus as Order['status']);
};

export default function KitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = () => {
      const stored = localStorage.getItem('kitchen-orders');
      if (stored) {
        const parsedOrders = JSON.parse(stored);
        // Migrate old status values to new ones
        const migratedOrders = parsedOrders.map((order: any) => ({
          ...order,
          status: migrateOrderStatus(order.status)
        }));
        setOrders(migratedOrders.length > 0 ? migratedOrders : dummyOrders);
        // Save migrated orders back to localStorage
        if (migratedOrders.length > 0) {
          localStorage.setItem('kitchen-orders', JSON.stringify(migratedOrders));
        }
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

  const getOrdersByStatus = (status: Order['status']) => {
    return orders.filter(order => order.status === status);
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: Order['status']) => {
    if (!draggedOrder) return;
    
    const order = orders.find(o => o.id === draggedOrder);
    if (!order) return;

    // Allow dropping in any status column
    updateOrderStatus(draggedOrder, targetStatus);
    setDraggedOrder(null);
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

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
          {statusOrder.map((status) => {
            const statusOrders = getOrdersByStatus(status);
            const config = statusConfig[status];
            
            return (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className={`${config.bgLight} ${config.borderColor} border-2 rounded-t-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-lg ${config.textColor}`}>
                      {config.label}
                    </h3>
                    <Badge className={config.color} variant="secondary">
                      {statusOrders.length}
                    </Badge>
                  </div>
                </div>

                {/* Column Content */}
                <div 
                  className={`${config.bgLight} ${config.borderColor} border-x-2 border-b-2 rounded-b-lg p-4 min-h-[500px] space-y-3 flex-1 transition-colors ${
                    draggedOrder ? 'hover:bg-secondary/20' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(status)}
                >
                  {statusOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                      No orders
                    </div>
                  ) : (
                    statusOrders.map((order) => (
                      <Card 
                        key={order.id}
                        draggable
                        onDragStart={() => handleDragStart(order.id)}
                        className={`shadow-sm hover:shadow-md transition-all duration-200 animate-fade-in border-l-4 cursor-move ${
                          draggedOrder === order.id ? 'opacity-50' : ''
                        }`}
                        style={{ borderLeftColor: `hsl(var(--${config.color}))` }}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-bold">
                                {order.tableNumber ? `Table ${order.tableNumber}` : `Room ${order.roomNumber}`}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground font-mono mt-1">
                                #{order.id}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                              <Clock className="h-3 w-3" />
                              <span>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3 pt-0">
                          {/* Order Items */}
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="text-sm flex justify-between items-center">
                                <span className="truncate flex-1">
                                  {item.name} <span className="text-muted-foreground">({item.portion})</span>
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Total */}
                          <div className="pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-medium">Total:</span>
                            <span className="text-lg font-bold">₹{order.total}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2 pt-2">
                            {getNextStatus(order.status) && (
                              <Button
                                className="w-full"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                              >
                                Move to {statusConfig[getNextStatus(order.status)!].label}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                            
                            {order.status === 'delivered' && (
                              <Button
                                variant="outline"
                                size="sm"
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
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
