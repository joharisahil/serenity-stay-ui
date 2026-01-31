import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import {
  createHallApi,
  getHallsApi,
  updateHallApi,
  deleteHallApi,
} from "@/api/banquetHallApi";

/* ---------------- TYPES ---------------- */

type Hall = {
  id: string;
  name: string;
  capacity: number;
  pricePerDay: number;
  isActive: boolean;
};

/* ---------------- COMPONENT ---------------- */

export default function Halls() {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- LOAD HALLS ---------------- */

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const data = await getHallsApi();
      setHalls(
        data.map((h: any) => ({
          id: h._id,
          name: h.name,
          capacity: h.capacity || 0,
          pricePerDay: h.pricePerDay || 0,
          isActive: h.isActive !== false,
        })),
      );
    } catch {
      toast.error("Failed to load halls");
    }
  };

  /* ---------------- HANDLERS ---------------- */

  const addHall = () => {
    setHalls([
      ...halls,
      {
        id: `temp-${Date.now()}`,
        name: "",
        capacity: 0,
        pricePerDay: 0,
        isActive: true,
      },
    ]);
  };

  const saveHall = async (hall: Hall) => {
    if (!hall.name) {
      toast.error("Hall name is required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: hall.name,
        capacity: hall.capacity,
        pricePerDay: hall.pricePerDay,
        isActive: hall.isActive,
      };

      if (hall.id.startsWith("temp")) {
        await createHallApi(payload);
        toast.success("Hall created successfully");
      } else {
        await updateHallApi(hall.id, payload);
        toast.success("Hall updated successfully");
      }

      fetchHalls();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save hall");
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();

  const removeHall = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hall?")) return;

    try {
      await deleteHallApi(id);
      toast.success("Hall deleted");
      fetchHalls();
    } catch {
      toast.error("Failed to delete hall");
    }
  };

  /* ---------------- UI ---------------- */

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
              <h1 className="text-3xl font-bold">Banquet Halls</h1>
              <p className="text-muted-foreground">
                Define halls, capacity & base charges
              </p>
            </div>
          </div>

          {/* RIGHT: Action */}
          <Button onClick={addHall}>
            <Plus className="mr-2 h-4 w-4" />
            Add Hall
          </Button>
        </div>

        {halls.map((hall, index) => (
          <Card key={hall.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hall Information</CardTitle>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => saveHall(hall)}
                  disabled={loading}
                >
                  <Save className="mr-1 h-4 w-4" />
                  Save
                </Button>

                {!hall.id.startsWith("temp") && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeHall(hall.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 md:grid-cols-4">
              {/* HALL NAME */}
              <div className="space-y-1">
                <Label>Hall Name</Label>
                <Input
                  placeholder="Eg: Grand Ballroom"
                  value={hall.name}
                  onChange={(e) => {
                    const copy = [...halls];
                    copy[index].name = e.target.value;
                    setHalls(copy);
                  }}
                />
              </div>

              {/* CAPACITY */}
              <div className="space-y-1">
                <Label>Maximum Capacity</Label>
                <Input
                  type="number"
                  placeholder="Number of guests"
                  value={hall.capacity}
                  onChange={(e) => {
                    const copy = [...halls];
                    copy[index].capacity = Number(e.target.value);
                    setHalls(copy);
                  }}
                />
              </div>

              {/* PRICE */}
              <div className="space-y-1">
                <Label>Base Hall Charges (₹ per day)</Label>
                <Input
                  type="number"
                  placeholder="Eg: 50000"
                  value={hall.pricePerDay}
                  onChange={(e) => {
                    const copy = [...halls];
                    copy[index].pricePerDay = Number(e.target.value);
                    setHalls(copy);
                  }}
                />
              </div>

              {/* STATUS */}
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={hall.isActive}
                    onCheckedChange={(v) => {
                      const copy = [...halls];
                      copy[index].isActive = v;
                      setHalls(copy);
                    }}
                  />
                  <span className="text-sm">
                    {hall.isActive ? "Active (Bookable)" : "Hidden"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
