import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Download, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

export default function GenerateBill() {
  const navigate = useNavigate();
  const [billType, setBillType] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [items, setItems] = useState<Array<{ name: string; quantity: number; price: number }>>([]);

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  const handleGenerate = () => {
    toast.success("Bill generated successfully!");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/billing")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Generate Bill</h1>
            <p className="text-muted-foreground">Create a new invoice</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="billType">Bill Type *</Label>
                  <Select value={billType} onValueChange={setBillType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="room">Room Booking</SelectItem>
                      <SelectItem value="banquet">Banquet Event</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {billType === "room" && (
                  <div className="space-y-2">
                    <Label htmlFor="room">Room Number *</Label>
                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select room" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="102">102 - Rajesh Kumar</SelectItem>
                        <SelectItem value="202">202 - Priya Sharma</SelectItem>
                        <SelectItem value="303">303 - Amit Patel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Items / Services</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                    />
                    <Input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    />
                    <Input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItem(index, "price", Number(e.target.value))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">₹{tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" onClick={handleGenerate}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Invoice
                </Button>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
