import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  code: string;
  name: string;
  rate: number;
}

export function CreateRoomDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    type: "",
    floor: "",
    baseRate: "",
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState({ code: "", name: "", rate: "" });

  const handleAddPlan = () => {
    if (currentPlan.code && currentPlan.name && currentPlan.rate) {
      setPlans([...plans, { 
        code: currentPlan.code, 
        name: currentPlan.name, 
        rate: parseFloat(currentPlan.rate) 
      }]);
      setCurrentPlan({ code: "", name: "", rate: "" });
    }
  };

  const handleRemovePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const roomData = {
      number: formData.number,
      type: formData.type || undefined,
      floor: formData.floor ? parseInt(formData.floor) : undefined,
      baseRate: formData.baseRate ? parseFloat(formData.baseRate) : undefined,
      plans: plans.length > 0 ? plans : undefined,
    };

    console.log("Room created:", roomData);
    toast.success("Room created successfully!");
    setOpen(false);
    setFormData({ number: "", type: "", floor: "", baseRate: "" });
    setPlans([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="space-y-3">
            <Label>Plans</Label>
            
            {plans.length > 0 && (
              <div className="space-y-2">
                {plans.map((plan, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{plan.code}</span> - {plan.name} (₹{plan.rate})
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
              <div className="col-span-3">
                <Input
                  placeholder="Code"
                  value={currentPlan.code}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, code: e.target.value })}
                />
              </div>
              <div className="col-span-5">
                <Input
                  placeholder="Plan Name"
                  value={currentPlan.name}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Rate"
                  value={currentPlan.rate}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, rate: e.target.value })}
                />
              </div>
              <div className="col-span-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddPlan}
                >
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
