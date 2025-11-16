import { Hotel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

export default function CustomerMenu() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Hotel className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Our Menu</h1>
          <p className="text-muted-foreground">Delicious food crafted with care</p>
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
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{item.name}</h3>
                            <Badge variant="outline" className="ml-2">
                              ₹{item.price}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>All prices are inclusive of taxes</p>
          <p className="mt-2">Contact staff for allergen information</p>
        </div>
      </div>
    </div>
  );
}
