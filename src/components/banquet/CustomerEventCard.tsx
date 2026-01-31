import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, AlertCircle } from "lucide-react";

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
  const isValidIndianMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
  };

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
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
          </div>

         <div className="space-y-1">
  <Label>Mobile Number</Label>

  <div className="relative">
    <Input
      placeholder="10-digit mobile"
      value={form.customerPhone}
      maxLength={10}
      inputMode="numeric"
      className={`pr-10 ${
        form.customerPhone.length > 0 &&
        (isValidIndianMobile(form.customerPhone)
          ? "border-green-500"
          : "border-red-500")
      }`}
      onChange={(e) => {
        const value = e.target.value.replace(/\D/g, "");
        setForm({ ...form, customerPhone: value });
      }}
    />

    {/* VALIDATION ICON */}
    {form.customerPhone.length > 0 && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {isValidIndianMobile(form.customerPhone) ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
      </span>
    )}
  </div>
</div>


          <div className="space-y-1">
            <Label>Event Type</Label>
            <Input
              placeholder="Wedding / Conference / Birthday"
              value={form.eventType}
              onChange={(e) => setForm({ ...form, eventType: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>No. of Guests</Label>
            <Input
              type="number"
              min={0}
              placeholder="Expected guests"
              value={form.guestsCount}
              onChange={(e) =>
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
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
