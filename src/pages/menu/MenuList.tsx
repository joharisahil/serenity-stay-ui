import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const menuItems = [
  { id: 1, name: "Paneer Tikka", category: "Starters", price: 280, status: "available" },
  { id: 2, name: "Veg Spring Roll", category: "Starters", price: 220, status: "available" },
  { id: 3, name: "Butter Chicken", category: "Main Course", price: 420, status: "available" },
  { id: 4, name: "Dal Makhani", category: "Main Course", price: 280, status: "available" },
  { id: 5, name: "Biryani", category: "Main Course", price: 350, status: "available" },
  { id: 6, name: "Gulab Jamun", category: "Desserts", price: 120, status: "available" },
  { id: 7, name: "Ice Cream", category: "Desserts", price: 100, status: "available" },
  { id: 8, name: "Fresh Juice", category: "Drinks", price: 150, status: "available" },
  { id: 9, name: "Masala Chai", category: "Drinks", price: 50, status: "unavailable" },
];

const categories = ["All", "Starters", "Main Course", "Desserts", "Drinks"];

export default function MenuList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = menuItems.filter(
    (item) =>
      (selectedCategory === "All" || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage your restaurant menu items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/menu/qr")}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Menu
            </Button>
            <Button onClick={() => navigate("/menu/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className="whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge variant={item.status === "available" ? "default" : "secondary"}>
                      {item.status === "available" ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <span className="text-lg font-bold text-primary">₹{item.price}</span>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
