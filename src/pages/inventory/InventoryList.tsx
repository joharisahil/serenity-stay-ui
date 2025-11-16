import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const inventoryItems = [
  { id: 1, name: "Towels", category: "Linens", quantity: 15, threshold: 50, supplier: "ABC Textiles", price: 150 },
  { id: 2, name: "Bed Sheets", category: "Linens", quantity: 20, threshold: 40, supplier: "ABC Textiles", price: 500 },
  { id: 3, name: "Pillow Covers", category: "Linens", quantity: 60, threshold: 50, supplier: "ABC Textiles", price: 80 },
  { id: 4, name: "Soap Bars", category: "Toiletries", quantity: 25, threshold: 100, supplier: "XYZ Supplies", price: 20 },
  { id: 5, name: "Shampoo Bottles", category: "Toiletries", quantity: 30, threshold: 80, supplier: "XYZ Supplies", price: 45 },
  { id: 6, name: "Tissue Boxes", category: "Supplies", quantity: 18, threshold: 60, supplier: "PQR Distributors", price: 35 },
  { id: 7, name: "Cleaning Solution", category: "Cleaning", quantity: 75, threshold: 40, supplier: "Clean Pro", price: 250 },
  { id: 8, name: "Floor Mats", category: "Supplies", quantity: 42, threshold: 30, supplier: "Mat World", price: 400 },
];

export default function InventoryList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory List</h1>
            <p className="text-muted-foreground">View and manage all inventory items</p>
          </div>
          <Button onClick={() => navigate("/inventory/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium">Item Name</th>
                  <th className="p-4 text-left text-sm font-medium">Category</th>
                  <th className="p-4 text-left text-sm font-medium">Quantity</th>
                  <th className="p-4 text-left text-sm font-medium">Status</th>
                  <th className="p-4 text-left text-sm font-medium">Supplier</th>
                  <th className="p-4 text-left text-sm font-medium">Price</th>
                  <th className="p-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isLow = item.quantity < item.threshold;
                  return (
                    <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-medium">{item.name}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4">
                        <span className={isLow ? "font-bold text-warning" : ""}>{item.quantity}</span>
                        <span className="text-xs text-muted-foreground"> / {item.threshold}</span>
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <Badge className="bg-warning text-white">Low Stock</Badge>
                        ) : (
                          <Badge className="bg-success text-white">In Stock</Badge>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{item.supplier}</td>
                      <td className="p-4">
                        <span className="font-medium">₹{item.price}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
