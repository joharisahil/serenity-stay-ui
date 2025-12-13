import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getRoomTypesApi,
  getRoomsByTypeApi,
  getRoomPlansApi,
  getAvailableRoomsByDateTimeApi,
  createBookingApi
} from "@/api/bookingApi";

export default function CreateBooking() {
  const navigate = useNavigate();

  // ---------------------
  // FORM STATE
  // ---------------------
  const [formData, setFormData] = useState({
    guestName: "",
    guestPhone: "",
    checkIn: "",
    checkOut: "",
    roomType: "",
    roomNumber: "",
    planCode: "",
    adults: "1",
    children: "0",
    advancePaid: "",
    discount: "",
    gstEnabled: "true",
    notes: "",
  });

  // Extra services [{ name, price, days: [1,2] }]
  const [extras, setExtras] = useState<
    { name: string; price: string; days: number[] }[]
  >([]);

  const [guestIds, setGuestIds] = useState<
    { type: string; idNumber: string; nameOnId: string }[]
  >([]);

  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  // Billing summary
  const [summary, setSummary] = useState({
    nights: 0,
    roomPrice: 0,
    extrasTotal: 0,
    discountAmount: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    grandTotal: 0,
    balanceDue: 0,
  });

  // -----------------------------
  // LOAD ROOM TYPES
  // -----------------------------
  useEffect(() => {
    getRoomTypesApi()
      .then(setRoomTypes)
      .catch(() => toast.error("Failed to load room types"));
  }, []);

  // -----------------------------
  // LOAD ROOMS BY TYPE + DATETIME AVAILABILITY
  // -----------------------------
  useEffect(() => {
    async function loadRooms() {
      if (!formData.roomType || !formData.checkIn || !formData.checkOut) return;

      try {
        const availableRooms = await getAvailableRoomsByDateTimeApi(
          formData.checkIn,
          formData.checkOut,
          formData.roomType
        );

        setRooms(availableRooms);
      } catch (err: any) {
        toast.error("Failed to load rooms");
      }
    }
    loadRooms();
  }, [formData.roomType, formData.checkIn, formData.checkOut]);

  // -----------------------------
  // LOAD PLANS WHEN ROOM SELECTED
  // -----------------------------
  useEffect(() => {
    if (!formData.roomNumber) return;

    getRoomPlansApi(formData.roomNumber)
      .then(setPlans)
      .catch(() => toast.error("Failed to load plans"));
  }, [formData.roomNumber]);

  // -----------------------------
  // BILLING SUMMARY CALCULATION
  // -----------------------------
  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut) return;

    const checkInDT = new Date(formData.checkIn);
    const checkOutDT = new Date(formData.checkOut);

    const rawDays = (checkOutDT.getTime() - checkInDT.getTime()) / (1000 * 60 * 60 * 24);
    const nights = Math.max(1, Math.ceil(rawDays));

    const selectedPlan = plans.find((p) => p.key === formData.planCode);
    const roomPrice = selectedPlan ? selectedPlan.price * nights : 0;

    // Per-day extras calculation
    let extrasTotal = 0;
    extras.forEach((e) => {
      const price = Number(e.price || 0);
      const days = e.days.length > 0 ? e.days : Array.from({ length: nights }, (_, i) => i + 1);
      extrasTotal += price * days.length;
    });

    const base = roomPrice + extrasTotal;

    const discountPercent = Number(formData.discount || 0);
    const discountAmount = +((base * discountPercent) / 100).toFixed(2);

    const taxable = base - discountAmount;

    let cgst = 0;
    let sgst = 0;

    if (formData.gstEnabled === "true") {
      cgst = +(taxable * 0.025).toFixed(2);
      sgst = +(taxable * 0.025).toFixed(2);
    }

    const grandTotal = taxable + cgst + sgst;
    const advance = Number(formData.advancePaid || 0);

    setSummary({
      nights,
      roomPrice,
      extrasTotal,
      discountAmount,
      taxable,
      cgst,
      sgst,
      grandTotal,
      balanceDue: +(grandTotal - advance).toFixed(2),
    });
  }, [
    formData.checkIn,
    formData.checkOut,
    formData.planCode,
    formData.discount,
    formData.gstEnabled,
    formData.advancePaid,
    extras,
    plans
  ]);

  // -----------------------------
  // EXTRA SERVICES MANAGEMENT
  // -----------------------------
  const addExtra = () => {
    setExtras([...extras, { name: "", price: "", days: [] }]);
  };

  const updateExtra = (index: number, field: string, value: any) => {
    const copy = [...extras];
    (copy[index] as any)[field] = value;
    setExtras(copy);
  };

  const toggleExtraDay = (idx: number, day: number) => {
    const copy = [...extras];
    let days = copy[idx].days;

    if (days.includes(day)) {
      copy[idx].days = days.filter((d) => d !== day);
    } else {
      copy[idx].days = [...days, day];
    }

    setExtras(copy);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

  // -----------------------------
  // GUEST ID MANAGEMENT
  // -----------------------------
  const addGuestId = () => {
    setGuestIds([...guestIds, { type: "", idNumber: "", nameOnId: "" }]);
  };

  const updateGuestId = (index: number, field: string, value: string) => {
    const updated = [...guestIds];
    (updated[index] as any)[field] = value;
    setGuestIds(updated);
  };

  const removeGuestId = (index: number) => {
    setGuestIds(guestIds.filter((_, i) => i !== index));
  };

  // -----------------------------
  // SUBMIT BOOKING
  // -----------------------------
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      room_id: formData.roomNumber,
      guestName: formData.guestName,
      guestPhone: formData.guestPhone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      planCode: formData.planCode,
      gstEnabled: formData.gstEnabled === "true",
      adults: Number(formData.adults),
      children: Number(formData.children),
      advancePaid: Number(formData.advancePaid || 0),
      discount: Number(formData.discount || 0),
      addedServices: extras.map((ex) => ({
        name: ex.name,
        price: Number(ex.price),
        days: ex.days.length > 0 ? ex.days : undefined
      })),
      guestIds,
      notes: formData.notes,
    };

    try {
      await createBookingApi(payload);
      toast.success("Booking created successfully!");
      navigate("/rooms/bookings");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI START
  // -----------------------------
  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/rooms/bookings")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Room Booking</h1>
            <p className="text-muted-foreground">Fill guest and stay details</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">

            {/* ---------- GUEST INFO ---------- */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Label>Guest Name *</Label>
                <Input
                  required
                  value={formData.guestName}
                  onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                />

                <Label>Mobile *</Label>
                <Input
                  required
                  value={formData.guestPhone}
                  onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                />

                <Label>Adults *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.adults}
                  onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                />

                <Label>Children</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.children}
                  onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                />
              </CardContent>
            </Card>

            {/* ---------- GUEST ID PROOFS ---------- */}
            <Card>
              <CardHeader>
                <CardTitle>Guest ID Proofs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {guestIds.map((id, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <Label>ID Type *</Label>
                      <Select
                        value={id.type}
                        onValueChange={(value) => updateGuestId(idx, "type", value)}
                      >
                        <SelectTrigger><SelectValue placeholder="Select ID Type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                          <SelectItem value="Driving License">Driving License</SelectItem>
                          <SelectItem value="Passport">Passport</SelectItem>
                          <SelectItem value="Voter ID">Voter ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>ID Number *</Label>
                      <Input
                        value={id.idNumber}
                        onChange={(e) => updateGuestId(idx, "idNumber", e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Name on ID *</Label>
                        <Input
                          value={id.nameOnId}
                          onChange={(e) => updateGuestId(idx, "nameOnId", e.target.value)}
                        />
                      </div>

                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-10"
                        onClick={() => removeGuestId(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button type="button" onClick={addGuestId}>
                  <Plus className="h-4 w-4 mr-2" /> Add ID Proof
                </Button>
              </CardContent>
            </Card>

            {/* ---------- ROOM DETAILS ---------- */}
            <Card>
              <CardHeader>
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <Label>Room Type</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {roomTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label>Room</Label>
                <Select
                  value={formData.roomNumber}
                  onValueChange={(value) => {
                    const selectedRoom = rooms.find(r => r._id === value);

                    if (selectedRoom?.hasSameDayCheckout) {
                      const time = new Date(selectedRoom.checkoutTime);
                      toast.warning(
                        `Note: This room checks out today at ${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      );
                    }

                    setFormData({ ...formData, roomNumber: value });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r._id} value={r._id}>
                        {r.number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label>Plan</Label>
                <Select
                  value={formData.planCode}
                  onValueChange={(value) => setFormData({ ...formData, planCode: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.key} value={p.key}>
                        {p.label} — ₹{p.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

              </CardContent>
            </Card>

            {/* ---------- DATES ---------- */}
            <Card>
              <CardHeader><CardTitle>Stay Duration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Label>Check-in *</Label>
                <Input
                  type="datetime-local"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />

                <Label>Check-out *</Label>
                <Input
                  type="datetime-local"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </CardContent>
            </Card>

            {/* ---------- EXTRA SERVICES ---------- */}
            <Card>
              <CardHeader><CardTitle>Extra Services</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {extras.map((ex, idx) => (
                  <div key={idx} className="space-y-2 border p-3 rounded-lg">

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label>Name</Label>
                        <Input
                          value={ex.name}
                          onChange={(e) => updateExtra(idx, "name", e.target.value)}
                        />
                      </div>

                      <div className="flex-1">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={ex.price}
                          onChange={(e) => updateExtra(idx, "price", e.target.value)}
                        />
                      </div>

                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeExtra(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Per-day checkboxes */}
                    <div className="flex gap-3 flex-wrap">
                      {Array.from({ length: summary.nights }).map((_, i) => {
                        const day = i + 1;
                        return (
                          <div
                            key={day}
                            className="flex items-center gap-2 border px-2 py-1 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={ex.days.includes(day)}
                              onChange={() => toggleExtraDay(idx, day)}
                            />
                            <span>Day {day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button type="button" onClick={addExtra}>
                  <Plus className="h-4 w-4 mr-2" /> Add Extra Service
                </Button>
              </CardContent>
            </Card>

            {/* ---------- BILLING SUMMARY ---------- */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Billing Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-lg">

                <p>Nights: <strong>{summary.nights}</strong></p>
                <p>Room Charges: ₹{summary.roomPrice}</p>
                <p>Extras: ₹{summary.extrasTotal}</p>

                {/* DISCOUNT INPUT */}
                <Label>Discount %</Label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />

                {/* DISCOUNT AMOUNT */}
                <p className="font-semibold">Discount Amount: ₹{summary.discountAmount}</p>

                {/* GST TOGGLE */}
                <Label>Apply GST?</Label>
                <Select
                  value={formData.gstEnabled}
                  onValueChange={(value) => setFormData({ ...formData, gstEnabled: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes (CGST + SGST)</SelectItem>
                    <SelectItem value="false">No GST</SelectItem>
                  </SelectContent>
                </Select>

                <p className="font-semibold pt-2">Taxable Amount: ₹{summary.taxable}</p>

                {formData.gstEnabled === "true" && (
                  <>
                    <div className="flex justify-between">
                      <span>CGST (2.5%)</span>
                      <span>₹{summary.cgst}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>SGST (2.5%)</span>
                      <span>₹{summary.sgst}</span>
                    </div>
                  </>
                )}

                <p className="text-xl font-bold mt-4">
                  Grand Total: ₹{summary.grandTotal}
                </p>

                {/* ADVANCE */}
                <Label>Advance Paid</Label>
                <Input
                  type="number"
                  value={formData.advancePaid}
                  onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                />

                <p className="text-2xl font-bold text-primary mt-4">
                  Balance Due: ₹{summary.balanceDue}
                </p>
              </CardContent>
            </Card>

            {/* ---------- NOTES ---------- */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </CardContent>
            </Card>

          </div>

          {/* SUBMIT BUTTON */}
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate("/rooms/bookings")}>
              Cancel
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Booking
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
