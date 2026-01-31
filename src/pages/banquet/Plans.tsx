import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { getCategoriesApi, searchMenuItemsApi } from "@/api/menuApi";
import {
  createPlanApi,
  getPlansApi,
  updatePlanApi,
  deletePlanApi,
} from "@/api/banquetPlanApi";

/* ================= TYPES ================= */

type MenuCategory = {
  _id: string;
  name: string;
};

type MenuItem = {
  _id: string;
  name: string;
  isVeg: boolean;
  category_id: string;
};

type PlanItem = {
  name: string;
  isVeg: boolean;
  categoryId: string;
  quantity: number;
  menuItemIds: string[];
};

type Plan = {
  id: string;
  name: string;
  ratePerPerson: number;
  isActive: boolean;
  items: PlanItem[];
};

/* ================= COMPONENT ================= */

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [cats, plansRes] = await Promise.all([
        getCategoriesApi(),
        getPlansApi(),
      ]);

      setCategories(cats);

      setPlans(
        plansRes.plans.map((p: any) => ({
          id: p._id,
          name: p.name,
          ratePerPerson: p.ratePerPerson,
          isActive: p.isActive,
          items: p.items.map((i: any) => ({
            name: i.title,
            isVeg: i.isVeg,
            categoryId: i.category_id,
            quantity: i.allowedQty,
            menuItemIds: i.allowedMenuItems || [],
          })),
        })),
      );
    } catch {
      toast.error("Failed to load plans");
    }
  };

  const loadMenuItems = async (categoryId: string, isVeg: boolean) => {
    const items = await searchMenuItemsApi("");
    setMenuItems(
      items.filter(
        (i: MenuItem) => i.category_id === categoryId && i.isVeg === isVeg,
      ),
    );
  };
  const navigate = useNavigate();

  /* ================= PLAN ACTIONS ================= */

  const addPlan = () => {
    setPlans([
      ...plans,
      {
        id: `temp-${Date.now()}`,
        name: "",
        ratePerPerson: 0,
        isActive: true,
        items: [],
      },
    ]);
  };

  const savePlan = async (plan: Plan) => {
    if (!plan.name) {
      toast.error("Plan name is required");
      return;
    }

    try {
      const payload = {
        name: plan.name,
        ratePerPerson: plan.ratePerPerson,
        isActive: plan.isActive,
        items: plan.items.map((i) => ({
          title: i.name,
          isVeg: i.isVeg,
          category_id: i.categoryId,
          allowedQty: i.quantity,
          allowedMenuItems: i.menuItemIds,
        })),
      };

      if (plan.id.startsWith("temp")) {
        await createPlanApi(payload);
        toast.success("Plan created");
      } else {
        await updatePlanApi(plan.id, payload);
        toast.success("Plan updated");
      }

      loadInitialData();
    } catch {
      toast.error("Failed to save plan");
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await deletePlanApi(id);
    toast.success("Plan deleted");
    loadInitialData();
  };

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}

        <div className="flex justify-between items-start">
          {/* LEFT: Back + Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/banquet")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">Banquet Plans</h1>
              <p className="text-muted-foreground">
                Define food packages & allowed menu items
              </p>
            </div>
          </div>

          {/* RIGHT: Action */}
          <Button onClick={addPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plan
          </Button>
        </div>

        {plans.map((plan, planIndex) => (
          <Card key={plan.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>Plan Configuration</CardTitle>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => savePlan(plan)}>
                  <Save className="mr-1 h-4 w-4" /> Save
                </Button>

                {!plan.id.startsWith("temp") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* PLAN BASIC INFO */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <Label>Plan Name</Label>
                  <Input
                    value={plan.name}
                    placeholder="Eg: Silver / Gold"
                    onChange={(e) => {
                      const c = [...plans];
                      c[planIndex].name = e.target.value;
                      setPlans(c);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Rate per Person (₹)</Label>
                  <Input
                    type="number"
                    value={plan.ratePerPerson}
                    onChange={(e) => {
                      const c = [...plans];
                      c[planIndex].ratePerPerson = Number(e.target.value);
                      setPlans(c);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={plan.isActive}
                      onCheckedChange={(v) => {
                        const c = [...plans];
                        c[planIndex].isActive = v;
                        setPlans(c);
                      }}
                    />
                    <span>{plan.isActive ? "Active" : "Hidden"}</span>
                  </div>
                </div>
              </div>

              {/* PLAN ITEMS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Plan Items</h3>
                  <Button
                    size="sm"
                    onClick={() => {
                      const c = [...plans];
                      c[planIndex].items.push({
                        name: "",
                        isVeg: true,
                        categoryId: "",
                        quantity: 1,
                        menuItemIds: [],
                      });
                      setPlans(c);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Item
                  </Button>
                </div>

                {plan.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    {/* ITEM ROW */}
                    <div className="grid md:grid-cols-5 gap-3 items-end">
                      <div className="space-y-1">
                        <Label>Item Title</Label>
                        <Input
                          value={item.name}
                          placeholder="Eg: Welcome Snacks"
                          onChange={(e) => {
                            const c = [...plans];
                            c[planIndex].items[itemIndex].name = e.target.value;
                            setPlans(c);
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Veg / Non-Veg</Label>
                        <div className="flex items-center gap-3 pt-2">
                          <Switch
                            checked={item.isVeg}
                            onCheckedChange={(v) => {
                              const c = [...plans];
                              c[planIndex].items[itemIndex].isVeg = v;
                              c[planIndex].items[itemIndex].menuItemIds = [];
                              setPlans(c);
                            }}
                          />
                          <span>{item.isVeg ? "Veg" : "Non-Veg"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label>Category</Label>
                        <Select
                          value={item.categoryId}
                          onValueChange={(v) => {
                            const c = [...plans];
                            c[planIndex].items[itemIndex].categoryId = v;
                            c[planIndex].items[itemIndex].menuItemIds = [];
                            setPlans(c);
                            loadMenuItems(v, item.isVeg);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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

                      <div className="space-y-1">
                        <Label>Qty Allowed</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const c = [...plans];
                            c[planIndex].items[itemIndex].quantity = Number(
                              e.target.value,
                            );
                            setPlans(c);
                          }}
                        />
                      </div>

                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          const c = [...plans];
                          c[planIndex].items.splice(itemIndex, 1);
                          setPlans(c);
                        }}
                      >
                        <Trash2 />
                      </Button>
                    </div>

                    {/* MENU ITEMS */}
                    {menuItems.length > 0 && (
                      <div className="space-y-2">
                        <Label>Allowed Menu Items (Optional)</Label>
                        <div className="flex flex-wrap gap-2">
                          {menuItems.map((mi) => (
                            <Button
                              key={mi._id}
                              size="sm"
                              variant={
                                item.menuItemIds.includes(mi._id)
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                const c = [...plans];
                                const selected =
                                  c[planIndex].items[itemIndex].menuItemIds;

                                c[planIndex].items[itemIndex].menuItemIds =
                                  selected.includes(mi._id)
                                    ? selected.filter((x) => x !== mi._id)
                                    : [...selected, mi._id];

                                setPlans(c);
                              }}
                            >
                              {mi.name}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Customer can choose up to <b>{item.quantity}</b> items
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
