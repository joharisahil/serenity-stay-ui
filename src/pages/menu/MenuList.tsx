import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, QrCode, Edit2Icon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreateCategoryDialog } from "@/components/CreateCategoryDialog";
import { getCategoriesApi } from "@/api/menuApi";
import { getMenuItemsApi } from "@/api/menuItemApi";

export default function MenuList() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [categoriesData, setCategoriesData] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // ----------------------------------
  // Load categories
  // ----------------------------------
  const loadCategories = async () => {
    try {
      const list = await getCategoriesApi();

      setCategoriesData(list);
      setCategories(["All", ...list.map((c: any) => c.name)]);
    } catch (err) {
      toast.error("Failed to fetch categories");
    }
  };

  // ----------------------------------
  // Load Items by Category
  // ----------------------------------
  const loadMenuItems = async (catName?: string) => {
    try {
      setLoadingItems(true);

      let categoryId = undefined;

      // find actual category id
      if (catName && catName !== "All") {
        const catObj = categoriesData.find((c: any) => c.name === catName);
        categoryId = catObj?._id;
      }

      const items = await getMenuItemsApi(categoryId);
      setMenuItems(items);
    } catch (err) {
      toast.error("Failed to load menu items");
    } finally {
      setLoadingItems(false);
    }
  };

  // ----------------------------------
  // Initial Load
  // ----------------------------------
  useEffect(() => {
    loadCategories();
    loadMenuItems(); // load all items initially
  }, []);

  // ----------------------------------
  // Filter by search
  // ----------------------------------
  const visibleItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground">Manage your restaurant menu items</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/menu/qr")}>
              <QrCode className="mr-2 h-4 w-4" />
              QR Menu
            </Button>

            <Button variant="outline" size="sm" onClick={() => navigate("/menu/category/edit")}>
              <Edit2Icon className="mr-2 h-4 w-4" />
              Edit Category
            </Button>

            <CreateCategoryDialog onCreated={loadCategories} />

            <Button size="sm" onClick={() => navigate("/menu/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Search + Categories */}
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
                    onClick={() => {
                      setSelectedCategory(cat);
                      loadMenuItems(cat);
                    }}
                    className="whitespace-nowrap"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}

        {loadingItems ? (
          <div className="flex justify-center py-14">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>

        ) : visibleItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No items found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleItems.map((item) => (
              <Card key={item._id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {categoriesData.find((c) => c._id === item.category_id)?.name}
                        </p>
                      </div>

                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? "Available" : "Unavailable"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-lg font-bold text-primary">
                        ₹
                        {item.priceFull ??
                          item.priceSingle ??
                          item.priceHalf ??
                          "--"}
                      </span>

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
        )}
      </div>
    </Layout>
  );
}
