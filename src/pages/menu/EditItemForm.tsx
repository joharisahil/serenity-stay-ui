import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateMenuItemApi } from "@/api/menuItemApi";

export const EditItemForm = ({ item, categories, onUpdated }: any) => {
    const [form, setForm] = useState({
        name: "",
        description: "",
        category_id: "",
        priceSingle: "",
        priceHalf: "",
        priceFull: "",
        isVeg: true,
        isActive: true,
    });

    const [loading, setLoading] = useState(false);

    // ✅ IMPORTANT FIX (pre-fill properly on item change)
    useEffect(() => {
        if (item) {
            setForm({
                name: item.name || "",
                description: item.description || "",
                category_id: item.category_id,
                priceSingle: item.priceSingle || "",
                priceHalf: item.priceHalf || "",
                priceFull: item.priceFull || "",
                isVeg: item.isVeg ?? true,
                isActive: item.isActive ?? true,
            });
        }
    }, [item]);

    const handleChange = (key: string, value: any) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

const handleSubmit = async () => {
  try {
    setLoading(true);

    const payload: any = {
      name: form.name,
      description: form.description,
      category_id: form.category_id,
      isVeg: form.isVeg,
      isActive: form.isActive,
    };

    // ✅ PRICE LOGIC (NO NULLS)

    if (form.priceSingle) {
      payload.priceSingle = Number(form.priceSingle);

      // ❌ DO NOT send null
      // just don't send priceHalf & priceFull at all
    } else {
      if (form.priceHalf !== "") {
        payload.priceHalf = Number(form.priceHalf);
      }

      if (form.priceFull !== "") {
        payload.priceFull = Number(form.priceFull);
      }

      // only send priceSingle if user typed it
      if (form.priceSingle !== "") {
        payload.priceSingle = Number(form.priceSingle);
      }
    }

    await updateMenuItemApi(item._id, payload);

    toast.success("Item updated successfully");
    onUpdated();
  } catch (err) {
    toast.error("Update failed");
  } finally {
    setLoading(false);
  }
};

    return (
        <div className="space-y-5">
            {/* BASIC INFO */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                    Basic Info
                </h4>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Item Name</label>
                    <Input
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Description</label>
                    <Input
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                        value={form.category_id}
                        onValueChange={(val) => handleChange("category_id", val)}
                    >
                        <SelectTrigger>
                            {categories.find((c: any) => c._id === form.category_id)?.name ||
                                "Select Category"}
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((c: any) => (
                                <SelectItem key={c._id} value={c._id}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* PRICING */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                    Pricing
                </h4>

                <div className="grid grid-cols-3 gap-2">
                    <Input
                        placeholder="Single"
                        value={form.priceSingle}
                        onChange={(e) => handleChange("priceSingle", e.target.value)}
                    />
                    <Input
                        placeholder="Half"
                        value={form.priceHalf}
                        onChange={(e) => handleChange("priceHalf", e.target.value)}
                    />
                    <Input
                        placeholder="Full"
                        value={form.priceFull}
                        onChange={(e) => handleChange("priceFull", e.target.value)}
                    />
                </div>
            </div>

            {/* STATUS */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">
                    Status
                </h4>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={form.isVeg ? "default" : "outline"}
                        onClick={() => handleChange("isVeg", true)}
                    >
                        Veg
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={!form.isVeg ? "default" : "outline"}
                        onClick={() => handleChange("isVeg", false)}
                    >
                        Non-Veg
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        type="button"
                        size="sm"
                        variant={form.isActive ? "default" : "outline"}
                        onClick={() => handleChange("isActive", true)}
                    >
                        Available
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant={!form.isActive ? "default" : "outline"}
                        onClick={() => handleChange("isActive", false)}
                    >
                        Unavailable
                    </Button>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={onUpdated}
                >
                    Cancel
                </Button>

                <Button
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Updating..." : "Update"}
                </Button>
            </div>
        </div>
    );
};