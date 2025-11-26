import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createTableApi } from "@/api/tableApi";

export function CreateTableDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    capacity: "",
    locationDesc: "",
  });

  const handleDialogChange = (val: boolean) => {
    setOpen(val);
    if (!val) {
      setFormData({ name: "", capacity: "", locationDesc: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Table name is required");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      capacity: formData.capacity ? Number(formData.capacity) : undefined,
      locationDesc: formData.locationDesc || undefined,
    };

    try {
      const res = await createTableApi(payload);
      toast.success("Table created successfully!");

      onCreated?.();
      setOpen(false);

      // Reset
      setFormData({ name: "", capacity: "", locationDesc: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create table");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Create Table
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Table</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Table Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Table 1, VIP-01"
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Guests)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              placeholder="e.g., 4"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location Description</Label>
            <Input
              id="location"
              value={formData.locationDesc}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  locationDesc: e.target.value,
                })
              }
              placeholder="e.g., Near the window, Outdoor area"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit">Create Table</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
