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
import { createCategoryApi } from "@/api/menuApi"; // <-- YOU WILL CREATE THIS API

interface Props {
  onCreated?: () => void;
}

export function CreateCategoryDialog({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    order: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    const payload: any = { name: form.name.trim() };

    if (form.order.trim() !== "") {
      payload.order = Number(form.order);
    }

    try {
      await createCategoryApi(payload);
      toast.success("Category created successfully!");
      setOpen(false);
      setForm({ name: "", order: "" });
      onCreated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create category");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label>Category Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Starters"
              required
            />
          </div>

          {/* Order (optional) */}
          {/* <div className="space-y-2">
            <Label>Display Order (optional)</Label>
            <Input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              placeholder="1"
            />
          </div> */}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
