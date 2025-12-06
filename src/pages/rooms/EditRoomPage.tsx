import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getRoomApi, updateRoomApi } from "@/api/roomApi";
import { Plus, X, ArrowLeft } from "lucide-react";

export default function EditRoomPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);

  const [formData, setFormData] = useState({
    number: "",
    type: "",
    floor: "",
    baseRate: "",
    maxGuests: "",
    status: "AVAILABLE",
  });

  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState({
    code: "",
    name: "",
    singlePrice: "",
    doublePrice: ""
  });


  useEffect(() => {
    const loadRoom = async () => {
      try {
        const data = await getRoomApi(id!);

        setRoom(data);

        setFormData({
          number: data.number || "",
          type: data.type || "",
          floor: data.floor?.toString() || "",
          baseRate: data.baseRate?.toString() || "",
          maxGuests: data.maxGuests?.toString() || "",
          status: data.status || "AVAILABLE",
        });

        setPlans(
          (data.plans || []).map((p: any) => ({
            code: p.code,
            name: p.name,
            singlePrice: p.singlePrice,
            doublePrice: p.doublePrice
          }))
        );


      } catch (err) {
        toast.error("Unable to load room");
      } finally {
        setLoading(false);
      }
    };
    loadRoom();
  }, [id]);

  const handleAddPlan = () => {
    if (
      currentPlan.code &&
      currentPlan.name &&
      currentPlan.singlePrice !== "" &&
      currentPlan.doublePrice !== ""
    ) {
      setPlans([
        ...plans,
        {
          code: currentPlan.code,
          name: currentPlan.name,
          singlePrice: Number(currentPlan.singlePrice),
          doublePrice: Number(currentPlan.doublePrice)
        }
      ]);

      setCurrentPlan({
        code: "",
        name: "",
        singlePrice: "",
        doublePrice: ""
      });
    } else {
      toast.error("Please enter all plan fields");
    }
  };


  const handleRemovePlan = (i: number) => {
    setPlans(plans.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      number: formData.number,
      type: formData.type,
      floor: Number(formData.floor),
      baseRate: Number(formData.baseRate),
      maxGuests: Number(formData.maxGuests),
      status: formData.status,
      plans: plans.map((p) => ({
        code: p.code,
        name: p.name,
        singlePrice: Number(p.singlePrice),
        doublePrice: Number(p.doublePrice)
      })),

    };

    try {
      await updateRoomApi(id!, payload);
      toast.success("Room updated successfully!");
      navigate("/rooms/manage");
    } catch (err) {
      toast.error("Failed to update room");
    }
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/rooms/manage")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Edit Room {room.number}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Room Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Room Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Number</Label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Room Type</Label>
                  <Input
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Floor</Label>
                  <Input
                    type="number"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Base Rate (₹)</Label>
                  <Input
                    type="number"
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Max Guests</Label>
                  <Input
                    type="number"
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="border rounded-md px-3 py-2 w-full"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>

              </div>

              {/* Meal Plans */}
              <div className="space-y-3 mt-6">
                <Label>Meal Plans</Label>

                {plans.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">
                      {p.code} - {p.name}
                      (Single: ₹{p.singlePrice}, Double: ₹{p.doublePrice})
                    </span>

                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePlan(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="grid grid-cols-12 gap-2">
                  <Input
                    className="col-span-2"
                    placeholder="Code"
                    value={currentPlan.code}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, code: e.target.value })}
                  />

                  <Input
                    className="col-span-4"
                    placeholder="Plan Name"
                    value={currentPlan.name}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                  />

                  <Input
                    className="col-span-3"
                    type="number"
                    placeholder="Single Price"
                    value={currentPlan.singlePrice}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, singlePrice: e.target.value })}
                  />

                  <Input
                    className="col-span-3"
                    type="number"
                    placeholder="Double Price"
                    value={currentPlan.doublePrice}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, doublePrice: e.target.value })}
                  />

                  <Button
                    className="col-span-1"
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddPlan}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Update Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
