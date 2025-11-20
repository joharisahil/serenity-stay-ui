import { Hotel, CheckCircle2, Clock, ChefHat, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

const menuItems = [
  { name: "Paneer Tikka", category: "Starters", price: 280, description: "Cottage cheese marinated in spices" },
  { name: "Veg Spring Roll", category: "Starters", price: 220, description: "Crispy rolls with mixed vegetables" },
  { name: "Butter Chicken", category: "Main Course", price: 420, description: "Tender chicken in rich tomato gravy" },
  { name: "Dal Makhani", category: "Main Course", price: 280, description: "Creamy black lentils slow cooked" },
  { name: "Biryani", category: "Main Course", price: 350, description: "Fragrant basmati rice with spices" },
  { name: "Gulab Jamun", category: "Desserts", price: 120, description: "Sweet milk dumplings in syrup" },
  { name: "Ice Cream", category: "Desserts", price: 100, description: "Choice of flavors" },
  { name: "Fresh Juice", category: "Drinks", price: 150, description: "Seasonal fresh fruit juice" },
];

const categories = ["Starters", "Main Course", "Desserts", "Drinks"];

interface SelectedItem {
  name: string;
  portion: 'half' | 'full';
  price: number;
}

export default function CustomerMenu() {
  const [step, setStep] = useState<'location' | 'menu' | 'order-placed'>('location');
  const [locationType, setLocationType] = useState<'table' | 'room'>('table');
  const [locationNumber, setLocationNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [orderId, setOrderId] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<'preparing' | 'coming-to-table' | 'received'>('preparing');

  const handleLocationSubmit = () => {
    if (locationNumber.trim()) {
      setStep('menu');
    }
  };

  const toggleItemSelection = (item: typeof menuItems[0], portion: 'half' | 'full') => {
    const itemKey = `${item.name}-${portion}`;
    const existingIndex = selectedItems.findIndex(
      si => si.name === item.name && si.portion === portion
    );

    if (existingIndex >= 0) {
      setSelectedItems(selectedItems.filter((_, idx) => idx !== existingIndex));
    } else {
      const price = portion === 'half' ? Math.round(item.price * 0.6) : item.price;
      setSelectedItems([...selectedItems, { name: item.name, portion, price }]);
    }
  };

  const isItemSelected = (itemName: string, portion: 'half' | 'full') => {
    return selectedItems.some(si => si.name === itemName && si.portion === portion);
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const gst = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + gst;

  const handlePlaceOrder = () => {
    const order = {
      id: Date.now().toString(),
      [locationType === 'table' ? 'tableNumber' : 'roomNumber']: locationNumber,
      items: selectedItems,
      total,
      status: 'preparing' as const,
      timestamp: new Date().toISOString()
    };

    // Store order in localStorage
    const existingOrders = JSON.parse(localStorage.getItem('kitchen-orders') || '[]');
    localStorage.setItem('kitchen-orders', JSON.stringify([...existingOrders, order]));

    setOrderId(order.id);
    setOrderStatus('preparing');
    setStep('order-placed');

    // Simulate status updates
    setTimeout(() => setOrderStatus('coming-to-table'), 10000);
    setTimeout(() => setOrderStatus('received'), 20000);
  };

  const statusConfig = {
    preparing: { label: 'Preparing Your Order', icon: ChefHat, color: 'text-orange-500' },
    'coming-to-table': { label: 'Coming to Your Location', icon: Package, color: 'text-blue-500' },
    received: { label: 'Order Received', icon: CheckCircle2, color: 'text-green-500' }
  };

  if (step === 'location') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Hotel className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
              <p className="text-muted-foreground">Please enter your location to view menu</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>I'm at</Label>
                <RadioGroup value={locationType} onValueChange={(v) => setLocationType(v as 'table' | 'room')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="table" id="table" />
                    <Label htmlFor="table" className="cursor-pointer">Table</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="room" id="room" />
                    <Label htmlFor="room" className="cursor-pointer">Room</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location-number">
                  {locationType === 'table' ? 'Table' : 'Room'} Number
                </Label>
                <Input
                  id="location-number"
                  type="text"
                  placeholder={`Enter ${locationType} number`}
                  value={locationNumber}
                  onChange={(e) => setLocationNumber(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleLocationSubmit}>
                View Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'order-placed') {
    const StatusIcon = statusConfig[orderStatus].icon;
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6 text-center">
            <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ${statusConfig[orderStatus].color}`}>
              <StatusIcon className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">{statusConfig[orderStatus].label}</h2>
              <p className="text-muted-foreground">Order #{orderId}</p>
              <p className="text-muted-foreground">
                {locationType === 'table' ? 'Table' : 'Room'} {locationNumber}
              </p>
            </div>
            <div className="space-y-2 text-left bg-accent/10 p-4 rounded-lg">
              <p className="font-semibold">Your Order:</p>
              {selectedItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.name} ({item.portion})</span>
                  <span>₹{item.price}</span>
                </div>
              ))}
              <div className="pt-2 border-t flex justify-between font-semibold">
                <span>Total:</span>
                <span>₹{total}</span>
              </div>
            </div>
            {orderStatus === 'received' && (
              <Button className="w-full" onClick={() => window.location.reload()}>
                Order Again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Hotel className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Our Menu</h1>
                <p className="text-muted-foreground">
                  {locationType === 'table' ? 'Table' : 'Room'} {locationNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu by Category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-4 text-2xl font-bold text-primary">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {menuItems
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <Card key={item.name} className="transition-shadow hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              ₹{item.price}
                            </Badge>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.name}-half`}
                                checked={isItemSelected(item.name, 'half')}
                                onCheckedChange={() => toggleItemSelection(item, 'half')}
                              />
                              <Label htmlFor={`${item.name}-half`} className="cursor-pointer">
                                Half (₹{Math.round(item.price * 0.6)})
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`${item.name}-full`}
                                checked={isItemSelected(item.name, 'full')}
                                onCheckedChange={() => toggleItemSelection(item, 'full')}
                              />
                              <Label htmlFor={`${item.name}-full`} className="cursor-pointer">
                                Full (₹{item.price})
                              </Label>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary - Fixed at bottom */}
        {selectedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg">
            <div className="mx-auto max-w-4xl p-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST (5%)</span>
                      <span>₹{gst}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>₹{total}</span>
                    </div>
                    <Button className="w-full" size="lg" onClick={handlePlaceOrder}>
                      Place Order ({selectedItems.length} items)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Spacer for fixed bottom bar */}
        {selectedItems.length > 0 && <div className="h-48" />}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8">
          <p>All prices are inclusive of taxes</p>
          <p className="mt-2">Contact staff for allergen information</p>
        </div>
      </div>
    </div>
  );
}
