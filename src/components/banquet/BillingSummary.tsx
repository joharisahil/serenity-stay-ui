import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { Hall, Plan, Service, Payment } from "@/pages/banquet/CreateBanquet";

/* ================= PROPS ================= */

type Props = {
  form: any;
  setForm: (form: any) => void;
  selectedPlan: Plan | null;
  halls: Hall[];
  services: Service[];
  payments: Payment[];
};

/* ================= COMPONENT ================= */

export default function BillingSummary({
  form,
  setForm,
  selectedPlan,
  halls,
  services,
  payments,
}: Props) {
  /* ---------- HALL ---------- */
  const hall = halls.find(h => h._id === form.hallId);

  /* ---------- FOOD ---------- */
  const foodAmount =
    form.pricingMode === "PLAN" && selectedPlan
      ? selectedPlan.ratePerPerson * Number(form.guestsCount || 0)
      : form.pricingMode === "CUSTOM_FOOD"
      ? Number(form.customFoodAmount || 0)
      : 0;

  /* ---------- HALL ---------- */
  const hallAmount =
    form.isHallComplimentary
      ? 0
      : hall?.pricePerDay || 0;

  /* ---------- SERVICES ---------- */
  const servicesAmount = services
    .filter(s => s.chargeable)
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  /* ---------- SUB TOTAL ---------- */
  const subTotal = foodAmount + hallAmount + servicesAmount;

  /* ---------- DISCOUNT ---------- */
  const discountType = form.discount?.type;
  const discountValue = Number(form.discount?.value || 0);

  const discountAmount =
    discountType === "PERCENT"
      ? (discountValue / 100) * subTotal
      : discountValue;

  const safeDiscount = Math.min(discountAmount, subTotal);

  /* ---------- TAX ---------- */
  const taxableAmount = subTotal - safeDiscount;
  const gstPercent = 18;

  const gstAmount = form.gstEnabled
    ? (taxableAmount * gstPercent) / 100
    : 0;

  /* ---------- GRAND TOTAL ---------- */
  const grandTotal = taxableAmount + gstAmount;

  /* ---------- PAYMENTS ---------- */
  const paidAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const balanceAmount = grandTotal - paidAmount;

  const bookingStatus =
    paidAmount === 0
      ? "ENQUIRY"
      : balanceAmount > 0
      ? "TENTATIVE"
      : "CONFIRMED";

  /* ================= UI ================= */

  return (
    <Card className="sticky top-24 border shadow-sm">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Billing Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">

        {/* CHARGES */}
        <Row label="Food Charges" value={foodAmount} />

        <Row
          label="Hall Charges"
          value={form.isHallComplimentary ? "Complimentary" : hallAmount}
        />

        <Row label="Additional Services" value={servicesAmount} />

        <Divider />

        <Row label="Sub Total" value={subTotal} bold />

        {/* DISCOUNT CONTROLS */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Discount Type</Label>
            <Select
              value={form.discount?.type}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  discount: {
                    ...form.discount,
                    type: v,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                <SelectItem value="FLAT">Flat (₹)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Discount Value</Label>
            <Input
              type="number"
              value={discountValue}
              onChange={(e) =>
                setForm({
                  ...form,
                  discount: {
                    ...form.discount,
                    value: Number(e.target.value),
                  },
                })
              }
            />
          </div>
        </div>

        {safeDiscount > 0 && (
          <Row
            label="Discount"
            value={`- ₹${safeDiscount.toLocaleString()}`}
            danger
          />
        )}

        {/* GST */}
        <div className="flex items-center justify-between pt-2">
          <Label className="text-sm">Apply GST</Label>
          <Switch
            checked={form.gstEnabled}
            onCheckedChange={(v) =>
              setForm({ ...form, gstEnabled: v })
            }
          />
        </div>

        {form.gstEnabled ? (
          <Row label={`GST (${gstPercent}%)`} value={gstAmount} />
        ) : (
          <div className="text-xs text-muted-foreground">
            GST not applicable
          </div>
        )}

        <Divider />

        {/* TOTALS */}
        <Row label="Grand Total" value={grandTotal} bold large />
        <Row label="Advance Paid" value={paidAmount} success />
        <Row label="Balance Due" value={balanceAmount} danger bold />

        <Divider />

        {/* STATUS */}
        <div className="flex justify-between items-center pt-2">
          <span className="text-muted-foreground">Booking Status</span>
          <span className="font-semibold">{bookingStatus}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= HELPERS ================= */

function Row({ label, value, bold, danger, success, large }: any) {
  return (
    <div
      className={`flex justify-between ${
        bold ? "font-semibold" : ""
      } ${large ? "text-base" : ""}`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${
          danger
            ? "text-red-600"
            : success
            ? "text-green-600"
            : ""
        }`}
      >
        {typeof value === "number"
          ? `₹${value.toLocaleString()}`
          : value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="border-t pt-2" />;
}
