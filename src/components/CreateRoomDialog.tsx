import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createRoomApi } from "@/api/roomApi";

interface Plan {
  code: string;
  name: string;
  singlePrice: number;
  doublePrice: number;
}

export function CreateRoomDialog({ onRoomCreated }: { onRoomCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    type: "",
    floor: "",
    baseRate: "",
    maxGuests: "",
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState({ code: "", name: "", singlePrice: "", doublePrice: "" });

  // Allow adding plan even if rate is 0.
  const handleAddPlan = () => {
    const { code, name, singlePrice, doublePrice } = currentPlan;

    // require code and name, allow rate 0 (but reject NaN / empty)
    if (!code || !name) {
      toast.error("Please enter plan code and name");
      return;
    }
    if (singlePrice === "" || doublePrice === "") {
      toast.error("Please enter both rates");
      return;
    }

    setPlans([
      ...plans,
      { code, name, singlePrice: Number(singlePrice), doublePrice: Number(doublePrice) }
    ]);
    setCurrentPlan({ code: "", name: "", singlePrice: "", doublePrice: "" });
  };

  const handleRemovePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handleDialogChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      // Reset everything when dialog closes
      setFormData({ number: "", type: "", floor: "", baseRate: "", maxGuests: "" });
      setPlans([]);
      setCurrentPlan({ code: "", name: "", singlePrice: "", doublePrice: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Take existing plans (already validated on add).
    const finalPlans: Plan[] = [...plans];

    // Also include current un-added plan if it has code+name and a valid rate (allow 0)
    const code = currentPlan.code.trim();
    const name = currentPlan.name.trim();

    const rateSingleNum =
      currentPlan.singlePrice === "" ? NaN : Number(currentPlan.singlePrice);
    const rateDoubleNum =
      currentPlan.doublePrice === "" ? NaN : Number(currentPlan.doublePrice);

    if (code || name || currentPlan.singlePrice !== "" || currentPlan.doublePrice !== "") {
      // Only include if code & name present and rate is a valid number (0 allowed)
      if (code && name && !isNaN(rateSingleNum) && !isNaN(rateDoubleNum)) {
        finalPlans.push({ code, name, singlePrice: rateSingleNum, doublePrice: rateDoubleNum });
      } else {
        // If user has partially filled last row but it's invalid, ignore it silently
        // or you can show a toast — choosing silent ignore to match request
        // toast.error("Incomplete plan ignored (code/name/rate required)");
      }
    }

    // Filter finalPlans again to be safe (ensure code,name present and rate is number)
    const validPlans = finalPlans.filter(
      (p) =>
        typeof p.code === "string" &&
        p.code.trim() !== "" &&
        typeof p.name === "string" &&
        p.name.trim() !== "" &&
        typeof p.singlePrice === "number" &&
        !isNaN(p.singlePrice) &&
        typeof p.doublePrice === "number" &&
        !isNaN(p.doublePrice)
    );

    const roomData = {
      number: formData.number,
      type: formData.type || undefined,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      baseRate: formData.baseRate ? parseFloat(formData.baseRate) : undefined,
      maxGuests: formData.maxGuests ? Number(formData.maxGuests) : undefined,
      plans: validPlans.length > 0 ? validPlans : undefined,
    };

    try {
      const res = await createRoomApi(roomData);

      toast.success("Room created successfully!");
      console.log("Room created:", res.room);
      onRoomCreated?.();
      setOpen(false);
      setFormData({ number: "", type: "", floor: "", baseRate: "", maxGuests: "" });
      setPlans([]);
      setCurrentPlan({ code: "", name: "", singlePrice: "", doublePrice: "" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create room");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="number">Room Number *</Label>
            <Input
              id="number"
              required
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="e.g., 101"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Room Type</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g., Deluxe, Suite"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="e.g., 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseRate">Base Rate (₹)</Label>
              <Input
                id="baseRate"
                type="number"
                step="0.01"
                value={formData.baseRate}
                onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                placeholder="e.g., 2500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxGuests">Number of Guests</Label>
              <Input
                id="maxGuests"
                type="number"
                min="1"
                value={formData.maxGuests}
                onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                placeholder="e.g., 2"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Plans</Label>

            {plans.length > 0 && (
              <div className="space-y-2">
                {plans.map((plan, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{plan.code}</span> - {plan.name}
                      (Single: ₹{plan.singlePrice}, Double: ₹{plan.doublePrice})
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePlan(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-2">
                <Input placeholder="Code" value={currentPlan.code}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, code: e.target.value })} />
              </div>

              <div className="col-span-4">
                <Input placeholder="Plan Name" value={currentPlan.name}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })} />
              </div>

              <div className="col-span-3">
                <Input type="number" placeholder="Single Rate"
                  value={currentPlan.singlePrice}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, singlePrice: e.target.value })} />
              </div>

              <div className="col-span-3">
                <Input type="number" placeholder="Double Rate"
                  value={currentPlan.doublePrice}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, doublePrice: e.target.value })} />
              </div>

              <div className="col-span-1">
                <Button type="button" variant="outline" size="icon" onClick={handleAddPlan}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Room</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
