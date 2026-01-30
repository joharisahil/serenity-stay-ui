import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function HallSelectionCard({ form, setForm, halls }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hall Selection</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-4">
        <Select
          value={form.hallId}
          onValueChange={v => setForm({ ...form, hallId: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Hall" />
          </SelectTrigger>
          <SelectContent>
            {halls.map((h: any) => (
              <SelectItem key={h._id} value={h._id}>
                {h.name} (Cap {h.capacity}, ₹{h.pricePerDay})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.isHallComplimentary}
            onCheckedChange={v =>
              setForm({ ...form, isHallComplimentary: v })
            }
          />
          <Label>Hall Complimentary</Label>
        </div>
      </CardContent>
    </Card>
  );
}
