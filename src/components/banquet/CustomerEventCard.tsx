import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  form: {
    customerName: string;
    customerPhone: string;
    eventType: string;
    guestsCount: number;
    notes: string;
  };
  setForm: (data: any) => void;
};

export default function CustomerEventCard({ form, setForm }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer & Event Details</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ROW 1 */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>Customer Name</Label>
            <Input
              placeholder="Eg: Sharma Family"
              value={form.customerName}
              onChange={e =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Mobile Number</Label>
            <Input
              placeholder="10-digit mobile"
              value={form.customerPhone}
              onChange={e =>
                setForm({ ...form, customerPhone: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>Event Type</Label>
            <Input
              placeholder="Wedding / Conference / Birthday"
              value={form.eventType}
              onChange={e =>
                setForm({ ...form, eventType: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <Label>No. of Guests</Label>
            <Input
              type="number"
              min={0}
              placeholder="Expected guests"
              value={form.guestsCount}
              onChange={e =>
                setForm({
                  ...form,
                  guestsCount: Number(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* NOTES */}
        <div className="space-y-1">
          <Label>Internal Notes (Optional)</Label>
          <Textarea
            placeholder="Special instructions, VIP guest, decoration notes..."
            value={form.notes}
            onChange={e =>
              setForm({ ...form, notes: e.target.value })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
