import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getCategoriesApi } from "@/api/menuApi";
import { createMenuItemApi } from "@/api/menuItemApi";

export default function AddMenuItem() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    isActive: true,
    prepTimeMins: "",
    imageUrl: "",
    pricingType: "single", // single | half_full | only_half | only_full
    price: "",       // for single price
    priceHalf: "",
    priceFull: "",
    isVeg: true
  });

  // Load categories
  useEffect(() => {
    const load = async () => {
      try {
        const list = await getCategoriesApi();
        setCategories(list);
      } catch (err) {
        toast.error("Failed to load categories");
      } finally {
        setLoadingCats(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category_id) {
      toast.error("Please select a category");
      return;
    }

    const payload: any = {
      name: formData.name,
      category_id: formData.category_id,
      description: formData.description,
      isActive: formData.isActive,
      prepTimeMins: Number(formData.prepTimeMins || 0),
      imageUrl: formData.imageUrl,
      isVeg: formData.isVeg,
    };

    if (formData.pricingType === "single") payload.price = Number(formData.price);
    if (formData.pricingType === "half_full") {
      payload.priceHalf = Number(formData.priceHalf);
      payload.priceFull = Number(formData.priceFull);
    }
    if (formData.pricingType === "only_half") payload.priceHalf = Number(formData.priceHalf);
    if (formData.pricingType === "only_full") payload.priceFull = Number(formData.priceFull);

    try {
      setSubmitting(true);
      await createMenuItemApi(payload);
      toast.success("Menu item created!");
      navigate("/menu");
    } catch (err) {
      toast.error("Unable to create menu item");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Layout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/menu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Menu Item</h1>
            <p className="text-muted-foreground">Create a new menu item</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">

                {/* Name + Category */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingCats ? "Loading..." : "Select category"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Pricing Type */}
                <div className="space-y-2">
                  <Label>Pricing Type *</Label>
                  <Select
                    value={formData.pricingType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, pricingType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Price</SelectItem>
                      <SelectItem value="half_full">Half + Full</SelectItem>
                      <SelectItem value="only_half">Only Half</SelectItem>
                      <SelectItem value="only_full">Only Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pricing UI Based on Type */}
                {formData.pricingType === "single" && (
                  <div className="space-y-2">
                    <Label>Price (₹) *</Label>
                    <Input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                )}

                {formData.pricingType === "half_full" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Half Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.priceHalf}
                        onChange={(e) =>
                          setFormData({ ...formData, priceHalf: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Price (₹)</Label>
                      <Input
                        type="number"
                        value={formData.priceFull}
                        onChange={(e) =>
                          setFormData({ ...formData, priceFull: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {formData.pricingType === "only_half" && (
                  <div className="space-y-2">
                    <Label>Half Price (₹)</Label>
                    <Input
                      type="number"
                      value={formData.priceHalf}
                      onChange={(e) =>
                        setFormData({ ...formData, priceHalf: e.target.value })
                      }
                    />
                  </div>
                )}

                {formData.pricingType === "only_full" && (
                  <div className="space-y-2">
                    <Label>Full Price (₹)</Label>
                    <Input
                      type="number"
                      value={formData.priceFull}
                      onChange={(e) =>
                        setFormData({ ...formData, priceFull: e.target.value })
                      }
                    />
                  </div>
                )}

                {/* Prep Time */}
                <div className="space-y-2">
                  <Label>Preparation Time (mins)</Label>
                  <Input
                    type="number"
                    value={formData.prepTimeMins}
                    onChange={(e) =>
                      setFormData({ ...formData, prepTimeMins: e.target.value })
                    }
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {/* Veg / Non-Veg Toggle */}
                <div className="flex items-center justify-between border p-3 rounded-md">
                  <Label>Veg / Non-Veg</Label>
                  <Select
                    value={formData.isVeg ? "veg" : "nonveg"}
                    onValueChange={(v) =>
                      setFormData({ ...formData, isVeg: v === "veg" })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="veg">Veg</SelectItem>
                      <SelectItem value="nonveg">Non-Veg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                {/* Availability */}
                <div className="flex items-center justify-between">
                  <Label>Available for Order</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>

              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/menu")}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Add Item
                </>
              )}
            </Button>

          </div>
        </form>
      </div>
    </Layout>
  );
}
