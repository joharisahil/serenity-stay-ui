import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getBanquetBookingByIdApi,
  updateBanquetBookingApi,
  getAvailableHallsApi,
  cancelBanquetBookingApi,
} from "@/api/banquetBookingApi";
import { getPlansApi } from "@/api/banquetPlanApi";
import { Textarea } from "@/components/ui/textarea";

/* ================= TYPES ================= */

type Hall = {
  _id: string;
  name: string;
  capacity: number;
  pricePerDay: number;
  isComplimentary?: boolean;
};

type Plan = {
  _id: string;
  name: string;
  ratePerPerson: number;
};

type Service = {
  name: string;
  amount: number;
  chargeable: boolean;
};

type Payment = {
  type: "ADVANCE" | "FINAL";
  amount: number;
  mode: string;
  date: string;
};

type Discount = {
  type: "PERCENT" | "FLAT";
  value: number;
};

type BookingForm = {
  customerName: string;
  mobile: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  hallId: string;
  guests: number;
  pricingMode: "PLAN" | "CUSTOM_FOOD" | "HALL_ONLY";
  planId: string;
  customFoodAmount: number;
  notes: string;
  discount: Discount;
  gstEnabled: boolean;
};

/* ================= COMPONENT ================= */

export default function BanquetDetails() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<BookingForm | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [availableHalls, setAvailableHalls] = useState<Hall[]>([]);
  const [currentHall, setCurrentHall] = useState<Hall | null>(null);

  /* ================= LOAD BOOKING ================= */

  useEffect(() => {
    if (!bookingId) return;

    getBanquetBookingByIdApi(bookingId)
      .then(res => {
        const b = res.booking ?? res;

        setForm({
          customerName: b.customerName,
          mobile: b.customerPhone,
          eventType: b.eventType,
          eventDate: new Date(b.eventDate).toISOString().slice(0, 10),
          startTime: b.startTime,
          endTime: b.endTime,
          hallId: b.hall._id,
          guests: b.guestsCount,
          pricingMode: b.pricingMode,
          planId: b.plan?._id || "",
          customFoodAmount: b.customFoodAmount || 0,
          notes: b.notes || "",
          discount: b.discount || { type: "FLAT", value: 0 },
          gstEnabled: b.gstEnabled ?? false,
        });

        setCurrentHall({
          _id: b.hall._id,
          name: b.hall.name,
          capacity: b.hall.capacity,
          pricePerDay: b.hall.baseCharge,
          isComplimentary: b.hall.isComplimentary,
        });

        setServices(b.services || []);
        setPayments(
          (b.payments || []).map((p: any) => ({
            ...p,
            date: new Date(p.date).toISOString().slice(0, 10),
          }))
        );
      })
      .catch(() => toast.error("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  /* ================= LOAD PLANS ================= */

  useEffect(() => {
    if (!form || form.pricingMode !== "PLAN") return;

    getPlansApi().then(res => {
      const active = res.plans.filter((p: any) => p.isActive);
      setPlans(active);
      setSelectedPlan(active.find((p: any) => p._id === form.planId) || null);
    });
  }, [form?.pricingMode, form?.planId]);

  /* ================= LOAD HALLS ================= */

  useEffect(() => {
    if (!form?.eventDate || !form.startTime || !form.endTime) return;

    getAvailableHallsApi({
      date: form.eventDate,
      startTime: form.startTime,
      endTime: form.endTime,
    }).then(res => {
      let halls = res.halls || [];

      if (
        currentHall &&
        !halls.some((h: Hall) => h._id === currentHall._id)
      ) {
        halls.unshift(currentHall);
      }

      setAvailableHalls(halls);
    });
  }, [form?.eventDate, form?.startTime, form?.endTime, currentHall]);

  /* ================= CALCULATIONS ================= */

  if (loading || !form) {
    return (
      <Layout>
        <div className="p-10 text-center text-muted-foreground">
          Loading booking details...
        </div>
      </Layout>
    );
  }

  const hall = availableHalls.find(h => h._id === form.hallId);

  const foodAmount =
    form.pricingMode === "PLAN" && selectedPlan
      ? selectedPlan.ratePerPerson * form.guests
      : form.pricingMode === "CUSTOM_FOOD"
        ? form.customFoodAmount
        : 0;

  const hallAmount =
    hall && !hall.isComplimentary ? hall.pricePerDay : 0;

  const servicesAmount = services
    .filter(s => s.chargeable)
    .reduce((sum, s) => sum + s.amount, 0);

  const subTotal = foodAmount + hallAmount + servicesAmount;

  const discountAmount =
    form.discount.type === "PERCENT"
      ? (form.discount.value / 100) * subTotal
      : form.discount.value;

  const taxable = Math.max(subTotal - discountAmount, 0);
  const gstAmount = form.gstEnabled ? (taxable * 18) / 100 : 0;

  const totalAmount = taxable + gstAmount;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalAmount - totalPaid;

  const paymentStatus =
    totalPaid === 0 ? "DUE" :
      totalPaid < totalAmount ? "PARTIAL" : "PAID";

  /* ================= SAVE ================= */

  const addService = () => setServices([...services, { name: "", amount: 0, chargeable: true }]);
  const addPayment = (type: "ADVANCE" | "FINAL") =>
    setPayments([
      ...payments,
      {
        type,
        amount: 0,
        mode: "CASH",
        date: "",
      },
    ]);

  const saveBooking = async () => {
    try {
      await updateBanquetBookingApi(bookingId!, {
        ...form,
        guestsCount: form.guests,
        discount: form.discount.value ? form.discount : undefined,
        services,
        payments,
      });

      toast.success("Booking updated successfully");
    } catch {
      toast.error("Failed to update booking");
    }
  };

  const cancelBooking = async () => {
    if (!bookingId) return;

    const ok = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone."
    );

    if (!ok) return;

    try {
      await cancelBanquetBookingApi(bookingId);
      toast.success("Booking cancelled successfully");
      navigate("/banquet");
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel booking");
    }
  };


  /* ================= UI ================= */

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT FORM */}
        <div className="lg:col-span-8 space-y-6">

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/banquet")}>
                <ArrowLeft />
              </Button>
              <h1 className="text-3xl font-bold">Edit Banquet Booking</h1>
            </div>

            <Badge
              className={
                paymentStatus === "PAID"
                  ? "bg-green-600"
                  : paymentStatus === "PARTIAL"
                    ? "bg-yellow-500"
                    : "bg-red-600"
              }
            >
              {paymentStatus}
            </Badge>
          </div>

          {/* CUSTOMER */}
          <Card>
            <CardHeader><CardTitle>Customer & Event</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-4 gap-4">
              <Input value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })} />
              <Input value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })} />
              <Input value={form.eventType}
                onChange={e => setForm({ ...form, eventType: e.target.value })} />
              <Input type="number" value={form.guests}
                onChange={e => setForm({ ...form, guests: Number(e.target.value) })} />
            </CardContent>
          </Card>
          {/* NOTES */}
          <Card>
            <CardHeader>
              <CardTitle>Notes / Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add internal notes (e.g. welcome drinks, special instructions)"
                value={form.notes}
                onChange={e =>
                  setForm({ ...form, notes: e.target.value })
                }
                rows={3}
              />
            </CardContent>
          </Card>


          {/* DATE & TIME */}
          <Card>
            <CardHeader><CardTitle>Date & Time</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Input type="date" value={form.eventDate}
                onChange={e => setForm({ ...form, eventDate: e.target.value })} />
              <Input type="time" value={form.startTime}
                onChange={e => setForm({ ...form, startTime: e.target.value })} />
              <Input type="time" value={form.endTime}
                onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </CardContent>
          </Card>

          {/* HALL */}
          <Card>
            <CardHeader><CardTitle>Hall</CardTitle></CardHeader>
            <CardContent>
              <Select
                value={form.hallId}
                onValueChange={v => setForm({ ...form, hallId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Hall" />
                </SelectTrigger>
                <SelectContent>
                  {availableHalls.map(h => (
                    <SelectItem key={h._id} value={h._id}>
                      {h.name} – ₹{h.pricePerDay}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* PRICING */}
          <Card>
            <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Select
                value={form.pricingMode}
                onValueChange={v =>
                  setForm({ ...form, pricingMode: v as any })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLAN">Plan</SelectItem>
                  <SelectItem value="CUSTOM_FOOD">Custom Food</SelectItem>
                  <SelectItem value="HALL_ONLY">Hall Only</SelectItem>
                </SelectContent>
              </Select>

              {form.pricingMode === "PLAN" && (
                <Select
                  value={form.planId}
                  onValueChange={v => setForm({ ...form, planId: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.name} – ₹{p.ratePerPerson}/person
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {form.pricingMode === "CUSTOM_FOOD" && (
                <Input
                  type="number"
                  placeholder="Custom Food Amount"
                  value={form.customFoodAmount}
                  onChange={e =>
                    setForm({ ...form, customFoodAmount: Number(e.target.value) })
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* SERVICES */}
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Services</CardTitle>
              <Button size="sm" onClick={addService}>
                <Plus className="mr-2 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="grid grid-cols-4 gap-2">
                  <Input value={s.name}
                    onChange={e => {
                      const c = [...services];
                      c[i].name = e.target.value;
                      setServices(c);
                    }} />
                  <Input type="number" value={s.amount}
                    onChange={e => {
                      const c = [...services];
                      c[i].amount = Number(e.target.value);
                      setServices(c);
                    }} />
                  <Select
                    value={s.chargeable ? "yes" : "no"}
                    onValueChange={v => {
                      const c = [...services];
                      c[i].chargeable = v === "yes";
                      setServices(c);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Chargeable</SelectItem>
                      <SelectItem value="no">Free</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="destructive" size="icon"
                    onClick={() => setServices(services.filter((_, idx) => idx !== i))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* PAYMENTS */}
          <Card>
            <CardHeader className="flex justify-between">
              <CardTitle>Payments</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => addPayment("ADVANCE")}>
                  + Advance
                </Button>
                <Button size="sm" onClick={() => addPayment("FINAL")}>
                  + Final
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {payments.map((p, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <Badge variant="outline">{p.type}</Badge>

                  {/* AMOUNT */}
                  <Input
                    type="number"
                    value={p.amount}
                    onChange={e => {
                      const c = [...payments];
                      c[i].amount = Number(e.target.value);
                      setPayments(c);
                    }}
                  />

                  {/* ✅ PAYMENT MODE DROPDOWN */}
                  <Select
                    value={p.mode || "CASH"}
                    onValueChange={v => {
                      const c = [...payments];
                      c[i].mode = v;
                      setPayments(c);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* DATE */}
                  <Input
                    type="date"
                    value={p.date}
                    onChange={e => {
                      const c = [...payments];
                      c[i].date = e.target.value;
                      setPayments(c);
                    }}
                  />

                  {/* DELETE */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      setPayments(payments.filter((_, idx) => idx !== i))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Discount & GST</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              <Select
                value={form.discount.type}
                onValueChange={v =>
                  setForm({ ...form, discount: { ...form.discount, type: v as any } })
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percent</SelectItem>
                  <SelectItem value="FLAT">Flat</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                value={form.discount.value}
                onChange={e =>
                  setForm({
                    ...form,
                    discount: { ...form.discount, value: Number(e.target.value) },
                  })
                }
              />

              <div className="flex items-center gap-2">
                <span>GST</span>
                <Switch
                  checked={form.gstEnabled}
                  onCheckedChange={v => setForm({ ...form, gstEnabled: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          {/* <Button onClick={() => navigate(`/banquet/${bookingId}/invoice`)}>
              Final Invoice
            </Button> */}
          {/* ACTIONS */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              variant="destructive"
              onClick={cancelBooking}
              className="w-full sm:w-auto"
            >
              Cancel Booking
            </Button>

            <Button
              onClick={() => navigate(`/banquet/${bookingId}/proforma`)}
              className="w-full sm:w-auto"
            >
              Proforma Invoice
            </Button>

            <Button
              onClick={saveBooking}
              className="w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>

        </div>

        {/* RIGHT SUMMARY */}
        <div className="lg:col-span-4">
          <Card className="sticky top-24 border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Billing Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 text-sm">

              {/* CHARGES */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Charges
                </p>

                <div className="flex justify-between">
                  <span>Food Charges</span>
                  <span>₹{foodAmount}</span>
                </div>

                <div className="flex justify-between">
                  <span>Hall Charges</span>
                  <span>₹{hallAmount}</span>
                </div>

                <div className="flex justify-between">
                  <span>Additional Services</span>
                  <span>₹{servicesAmount}</span>
                </div>
              </div>

              <hr />

              {/* DEDUCTIONS */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Deductions
                </p>

                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              </div>

              <hr />

              {/* TAX */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  Tax
                </p>

                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>₹{gstAmount}</span>
                </div>
              </div>

              <hr />

              {/* TOTAL */}
              <div className="space-y-2">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total Amount</span>
                  <span>₹{totalAmount}</span>
                </div>

                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span>₹{totalPaid}</span>
                </div>

                <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2">
                  <span>Balance Due</span>
                  <span>₹{balance}</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
