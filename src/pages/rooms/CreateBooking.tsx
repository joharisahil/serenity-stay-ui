import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getRoomTypesApi,
  getRoomsByTypeApi,
  getRoomPlansApi,
  createBookingApi
} from "@/api/bookingApi";

export default function CreateBooking() {
  const navigate = useNavigate();

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
    notes: "",
  });

  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [extras, setExtras] = useState<{ name: string; price: string }[]>([]);
  const [guestIds, setGuestIds] = useState<
    { type: string; idNumber: string; nameOnId: string }[]
  >([]);


  // Billing Summary
  const [summary, setSummary] = useState({
    nights: 0,
    roomPrice: 0,
    extrasTotal: 0,
    grandTotal: 0,
    taxable: 0,
    cgst: 0,
    sgst: 0,
    balanceDue: 0,
  });

  /* ----------------------------------------------
      LOAD ROOM TYPES 
  ---------------------------------------------- */
  useEffect(() => {
    getRoomTypesApi()
      .then(setRoomTypes)
      .catch(() => toast.error("Failed to load room types"));
  }, []);

  /* ----------------------------------------------
      LOAD ROOMS BY SELECTED TYPE 
  ---------------------------------------------- */
  useEffect(() => {
    if (!formData.roomType) return;

    setFormData({ ...formData, roomNumber: "", planCode: "" });
    setPlans([]);
    setRooms([]);

    getRoomsByTypeApi(formData.roomType)
      .then(setRooms)
      .catch(() => toast.error("Failed to load rooms"));
  }, [formData.roomType]);

  /* ----------------------------------------------
      LOAD PLANS OF SELECTED ROOM 
  ---------------------------------------------- */
  useEffect(() => {
    if (!formData.roomNumber) return;

    getRoomPlansApi(formData.roomNumber)
      .then(setPlans)
      .catch(() => toast.error("Failed to load plans"));
  }, [formData.roomNumber]);

  /* ----------------------------------------------
      BILLING SUMMARY AUTO CALCULATION
  ---------------------------------------------- */
  useEffect(() => {
    if (!formData.checkIn || !formData.checkOut || !formData.planCode) return;

    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const nights = Math.max(
      1,
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const selectedPlan = plans.find((p) => p.key === formData.planCode);
    const roomPrice = selectedPlan ? selectedPlan.price * nights : 0;

    const extrasTotal = extras.reduce((sum, e) => sum + Number(e.price || 0), 0);

    const discount = Number(formData.discount || 0);

    const taxable = roomPrice + extrasTotal - discount;

    const cgst = +(taxable * 0.025).toFixed(2);
    const sgst = +(taxable * 0.025).toFixed(2);

    const grandTotal = taxable + cgst + sgst;

    const advancePaid = Number(formData.advancePaid || 0);

    const balanceDue = grandTotal - advancePaid;

    setSummary({
      nights,
      roomPrice,
      extrasTotal,
      grandTotal,
      taxable,
      cgst,
      sgst,
      balanceDue,
    });
  }, [
    formData.checkIn,
    formData.checkOut,
    formData.planCode,
    formData.advancePaid,
    formData.discount,
    extras,
  ]);



  /* ----------------------------------------------
      ADD EXTRA SERVICE 
  ---------------------------------------------- */
  const addExtra = () => {
    setExtras([...extras, { name: "", price: "" }]);
  };

  const updateExtra = (index: number, field: string, value: string) => {
    const newExtras = [...extras];
    (newExtras[index] as any)[field] = value;
    setExtras(newExtras);
  };

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index));
  };

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


  /* ----------------------------------------------
      SUBMIT BOOKING 
  ---------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      room_id: formData.roomNumber,
      guestName: formData.guestName,
      guestPhone: formData.guestPhone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      planCode: formData.planCode,
      adults: Number(formData.adults),
      children: Number(formData.children),
      advancePaid: Number(formData.advancePaid || 0),
      discount: Number(formData.discount || 0),    // ⭐ NEW
      balanceDue: summary.balanceDue,
      addedServices: extras.map((e) => ({
        name: e.name,
        price: Number(e.price),
      })),
      guestIds,
    };

    try {
      await createBookingApi(payload);
      toast.success("Booking created successfully!");
      navigate("/rooms/bookings");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    }
  };

  /* ----------------------------------------------
      UI STARTS 
  ---------------------------------------------- */
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

            {/* --------------------------------------- */}
            {/* GUEST DETAILS */}
            {/* --------------------------------------- */}
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
            {/* --------------------------------------- */}
            {/* GUEST ID PROOFS */}
            {/* --------------------------------------- */}
            <Card>
              <CardHeader>
                <CardTitle>Guest ID Proofs</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {guestIds.map((id, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                    {/* ID TYPE */}
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

                    {/* ID NUMBER */}
                    <div>
                      <Label>ID Number *</Label>
                      <Input
                        value={id.idNumber}
                        onChange={(e) => updateGuestId(idx, "idNumber", e.target.value)}
                      />
                    </div>

                    {/* NAME ON ID */}
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


            {/* --------------------------------------- */}
            {/* ROOM DETAILS */}
            {/* --------------------------------------- */}
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
                    {roomTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>

                <Label>Room Number</Label>
                <Select
                  value={formData.roomNumber}
                  onValueChange={(value) => setFormData({ ...formData, roomNumber: value })}
                >
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r._id} value={r._id}>{r.number}</SelectItem>
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

            {/* --------------------------------------- */}
            {/* DATES */}
            {/* --------------------------------------- */}
            <Card>
              <CardHeader><CardTitle>Stay Duration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Label>Check-in *</Label>
                <Input
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                />

                <Label>Check-out *</Label>
                <Input
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                />
              </CardContent>
            </Card>

            {/* --------------------------------------- */}
            {/* EXTRA SERVICES */}
            {/* --------------------------------------- */}
            <Card>
              <CardHeader><CardTitle>Extra Services</CardTitle></CardHeader>

              <CardContent className="space-y-4">
                {extras.map((ex, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
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
                    <Button variant="destructive" size="icon" onClick={() => removeExtra(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button type="button" onClick={addExtra}>
                  <Plus className="h-4 w-4 mr-2" /> Add Extra Service
                </Button>
              </CardContent>
            </Card>

            {/* --------------------------------------- */}
            {/* BILL SUMMARY */}
            {/* --------------------------------------- */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Billing Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-lg">
                <p>Nights: <strong>{summary.nights}</strong></p>

                <p>Room Charges: ₹{summary.roomPrice}</p>
                <p>Extras: ₹{summary.extrasTotal}</p>

                {/* DISCOUNT */}
                <Label className="mt-4">Discount</Label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />

                <p className="font-semibold pt-2">Taxable Amount: ₹{summary.taxable}</p>

                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>₹{summary.cgst}</span>
                </div>

                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>₹{summary.sgst}</span>
                </div>

                <p className="text-xl font-bold mt-4">
                  Grand Total: ₹{summary.grandTotal}
                </p>

                {/* ADVANCE */}
                <Label className="mt-4">Advance Paid</Label>
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

            {/* Notes */}
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
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Create Booking
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
