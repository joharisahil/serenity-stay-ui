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
  getAvailableRoomsByDateTimeApi,
  createBookingApi
} from "@/api/bookingApi";
import { getRoomPlansApi } from "@/api/roomApi";

export default function CreateBooking() {
  const navigate = useNavigate();

  /* ---------------- FORM STATE ---------------- */
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",

    roomType: "",
    roomNumber: "",
    planCode: "",

    guestName: "",
    guestPhone: "",
    guestCity: "",
    guestNationality: "",
    guestAddress: "",

    companyName: "",
    companyGSTIN: "",
    companyAddress: "",

    adults: "1",
    children: "0",

    discount: "",
    discountScope: "TOTAL",
    gstEnabled: "true",
    roundOffEnabled: "true",

    advancePaid: "",
    advancePaymentMode: "CASH",

    notes: "",
  });

  const [guestIds, setGuestIds] = useState<
    { type: string; idNumber: string; nameOnId: string }[]
  >([]);

  const [extras, setExtras] = useState<
    { name: string; price: string; days: number[]; gstEnabled: boolean }[]
  >([]);

  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    roundOffAmount: 0,
  });

  const staySelected = Boolean(formData.checkIn && formData.checkOut);

  /* ---------------- LOAD ROOM TYPES ---------------- */
  useEffect(() => {
    getRoomTypesApi()
      .then(setRoomTypes)
      .catch(() => toast.error("Failed to load room types"));
  }, []);

  /* ---------------- LOAD ROOMS ---------------- */
  useEffect(() => {
    if (!staySelected || !formData.roomType) return;

    getAvailableRoomsByDateTimeApi(
      formData.checkIn,
      formData.checkOut,
      formData.roomType
    )
      .then(setRooms)
      .catch(() => toast.error("Failed to load rooms"));
  }, [staySelected, formData.roomType]);

  /* ---------------- LOAD PLANS ---------------- */
  useEffect(() => {
    if (!formData.roomNumber) return;

    getRoomPlansApi(formData.roomNumber)
      .then(setPlans)
      .catch(() => toast.error("Failed to load plans"));
  }, [formData.roomNumber]);

  /* ---------------- BILL CALCULATION ---------------- */
  useEffect(() => {
    if (!staySelected) return;

    const inDT = new Date(formData.checkIn);
    const outDT = new Date(formData.checkOut);

    const nights = Math.max(
      1,
      Math.ceil((outDT.getTime() - inDT.getTime()) / 86400000)
    );

    const plan = plans.find(p => p.key === formData.planCode);
    const roomBase = plan ? plan.price * nights : 0;

    let extrasBaseGST = 0;     // services WITH GST
    let extrasBaseNoGST = 0;   // services WITHOUT GST

    extras.forEach(ex => {
      const days = ex.days.length
        ? ex.days
        : Array.from({ length: nights }, (_, i) => i + 1);

      const amount = Number(ex.price || 0) * days.length;

      if (ex.gstEnabled) extrasBaseGST += amount;
      else extrasBaseNoGST += amount;
    });

    // ---------- DISCOUNT ----------
    const discountPercent = Number(formData.discount || 0);

    let discountedRoomBase = roomBase;
    let discountedExtrasGST = extrasBaseGST;
    let discountedExtrasNoGST = extrasBaseNoGST;

    let discountAmount = 0;

    if (discountPercent > 0) {
      if (formData.discountScope === "TOTAL") {
        const grossBase = roomBase + extrasBaseGST + extrasBaseNoGST;
        discountAmount = +(grossBase * discountPercent / 100).toFixed(2);

        discountedRoomBase -= (discountAmount * roomBase) / grossBase;
        discountedExtrasGST -= (discountAmount * extrasBaseGST) / grossBase;
        discountedExtrasNoGST -= (discountAmount * extrasBaseNoGST) / grossBase;
      }

      if (formData.discountScope === "ROOM") {
        discountAmount = +(roomBase * discountPercent / 100).toFixed(2);
        discountedRoomBase -= discountAmount;
      }

      if (formData.discountScope === "EXTRAS") {
        const extrasBase = extrasBaseGST + extrasBaseNoGST;
        discountAmount = +(extrasBase * discountPercent / 100).toFixed(2);

        if (extrasBase > 0) {
          discountedExtrasGST -= (discountAmount * extrasBaseGST) / extrasBase;
          discountedExtrasNoGST -= (discountAmount * extrasBaseNoGST) / extrasBase;
        }
      }
    }


    // ---------- GST ----------
    let gstTotal = 0;

    if (formData.gstEnabled === "true") {
      // GST on room
      gstTotal += +(discountedRoomBase * 0.05).toFixed(2);

      // GST on services where GST is enabled
      gstTotal += +(discountedExtrasGST * 0.05).toFixed(2);
    }

    const cgst = +(gstTotal / 2).toFixed(2);
    const sgst = +(gstTotal / 2).toFixed(2);

    let grandTotal =
      discountedRoomBase +
      discountedExtrasGST +
      discountedExtrasNoGST +
      gstTotal;

    // ---------- ROUND OFF ----------
    let roundOffAmount = 0;

    if (formData.roundOffEnabled === "true") {
      const rounded = Math.round(grandTotal);
      roundOffAmount = +(rounded - grandTotal).toFixed(2);
      grandTotal = rounded;
    }

    const advance = Number(formData.advancePaid || 0);

    setSummary({
      nights,
      roomPrice: roomBase,
      extrasTotal: extrasBaseGST + extrasBaseNoGST,
      discountAmount,
      taxable: discountedRoomBase + discountedExtrasGST + discountedExtrasNoGST,
      cgst,
      sgst,
      grandTotal,
      balanceDue: +(grandTotal - advance).toFixed(2),
      roundOffAmount,
    });

  }, [
    staySelected,
    formData,
    extras,
    plans
  ]);


  /* ---------------- HELPERS ---------------- */
  const addGuestId = () =>
    setGuestIds([...guestIds, { type: "", idNumber: "", nameOnId: "" }]);

  const addExtra = () =>
    setExtras([
      ...extras,
      {
        name: "",
        price: "",
        days: summary.nights
          ? Array.from({ length: summary.nights }, (_, i) => i + 1)
          : [],
        gstEnabled: true,
      }
    ]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createBookingApi({
        room_id: formData.roomNumber,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,

        guestName: formData.guestName,
        guestPhone: formData.guestPhone,
        guestCity: formData.guestCity,
        guestNationality: formData.guestNationality,
        guestAddress: formData.guestAddress,

        companyName: formData.companyName,
        companyGSTIN: formData.companyGSTIN,
        companyAddress: formData.companyAddress,

        adults: Number(formData.adults),
        children: Number(formData.children),

        planCode: formData.planCode,
        gstEnabled: formData.gstEnabled === "true",
        roundOffEnabled: formData.roundOffEnabled === "true",
        roundOffAmount: summary.roundOffAmount,

        discount: Number(formData.discount || 0),
        advancePaid: Number(formData.advancePaid || 0),
        advancePaymentMode: formData.advancePaymentMode,

        guestIds,
        addedServices: extras.map(e => ({
          name: e.name,
          price: Number(e.price),
          days: e.days.length ? e.days : undefined,
          gstEnabled: e.gstEnabled,
        })),

        notes: formData.notes,
      });

      toast.success("Booking created successfully");
      navigate("/rooms/bookings");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <Layout>
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/rooms/bookings")}>
            <ArrowLeft />
          </Button>
          <h1 className="text-3xl font-bold">Create Room Booking</h1>
        </div>

        {/* STAY DURATION */}
        <Card>
          <CardHeader><CardTitle>Stay Duration</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Input type="datetime-local" value={formData.checkIn}
              onChange={e => setFormData({ ...formData, checkIn: e.target.value })} />
            <Input type="datetime-local" value={formData.checkOut}
              onChange={e => setFormData({ ...formData, checkOut: e.target.value })} />
          </CardContent>
        </Card>

        {/* ROOM DETAILS */}
        <Card>
          <CardHeader><CardTitle>Room Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <Select disabled={!staySelected} onValueChange={v => setFormData({ ...formData, roomType: v })}>
              <SelectTrigger><SelectValue placeholder="Room Type" /></SelectTrigger>
              <SelectContent>{roomTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>

            <Select disabled={!staySelected} onValueChange={v => setFormData({ ...formData, roomNumber: v })}>
              <SelectTrigger><SelectValue placeholder="Room" /></SelectTrigger>
              <SelectContent>{rooms.map(r => <SelectItem key={r._id} value={r._id}>{r.number}</SelectItem>)}</SelectContent>
            </Select>

            <Select disabled={!staySelected} onValueChange={v => setFormData({ ...formData, planCode: v })}>
              <SelectTrigger><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>{plans.map(p => <SelectItem key={p.key} value={p.key}>{p.label} - {p.price}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* GUEST INFO, IDS, EXTRAS, BILLING, NOTES */}

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Adults *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.adults}
                  onChange={(e) =>
                    setFormData({ ...formData, adults: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Children</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.children}
                  onChange={(e) =>
                    setFormData({ ...formData, children: e.target.value })
                  }
                />
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.guestCity}
                  onChange={(e) => setFormData({ ...formData, guestCity: e.target.value })}
                />
              </div>

              <div>
                <Label>Nationality</Label>
                <Input
                  value={formData.guestNationality}
                  onChange={(e) =>
                    setFormData({ ...formData, guestNationality: e.target.value })
                  }
                />
              </div>
            </div>

            <Label>Address</Label>
            <Textarea
              rows={2}
              value={formData.guestAddress}
              onChange={(e) =>
                setFormData({ ...formData, guestAddress: e.target.value })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company / GST Details (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            <Label>Company Name</Label>
            <Input
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
            />

            <Label>GSTIN</Label>
            <Input
              value={formData.companyGSTIN}
              onChange={(e) =>
                setFormData({ ...formData, companyGSTIN: e.target.value })
              }
            />

            <Label>Company Address</Label>
            <Textarea
              rows={2}
              value={formData.companyAddress}
              onChange={(e) =>
                setFormData({ ...formData, companyAddress: e.target.value })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guest ID Proofs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {guestIds.map((id, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-3 rounded-lg">

                <div>
                  <Label>ID Type</Label>
                  <Select
                    value={id.type}
                    onValueChange={(v) => {
                      const copy = [...guestIds];
                      copy[idx].type = v;
                      setGuestIds(copy);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aadhaar Card">Aadhaar Card</SelectItem>
                      <SelectItem value="Driving License">Driving License</SelectItem>
                      <SelectItem value="Passport">Passport</SelectItem>
                      <SelectItem value="Voter ID">Voter ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ID Number</Label>
                  <Input
                    value={id.idNumber}
                    onChange={(e) => {
                      const copy = [...guestIds];
                      copy[idx].idNumber = e.target.value;
                      setGuestIds(copy);
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Name on ID"
                    value={id.nameOnId}
                    onChange={(e) => {
                      const copy = [...guestIds];
                      copy[idx].nameOnId = e.target.value;
                      setGuestIds(copy);
                    }}
                  />

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      setGuestIds(guestIds.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" onClick={() =>
              setGuestIds([...guestIds, { type: "", idNumber: "", nameOnId: "" }])
            }>
              <Plus className="mr-2 h-4 w-4" /> Add ID Proof
            </Button>

          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Extra Services</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">

            {extras.map((ex, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 space-y-3 bg-secondary/20"
              >

                {/* HEADER ROW */}
                <div className="flex items-start justify-between gap-4">

                  {/* NAME + PRICE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
                    <Input
                      placeholder="Service name"
                      value={ex.name}
                      onChange={(e) => {
                        const copy = [...extras];
                        copy[idx].name = e.target.value;
                        setExtras(copy);
                      }}
                    />

                    <Input
                      type="number"
                      placeholder="Price"
                      value={ex.price}
                      onChange={(e) => {
                        const copy = [...extras];
                        copy[idx].price = e.target.value;
                        setExtras(copy);
                      }}
                    />
                  </div>

                  {/* REMOVE */}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setExtras(extras.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* GST TOGGLE */}
                <div className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={ex.gstEnabled}
                    onChange={() => {
                      const copy = [...extras];
                      copy[idx].gstEnabled = !ex.gstEnabled;
                      setExtras(copy);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Charged for {ex.days.length || summary.nights} day(s)
                  </p>

                  <span className="font-medium">Apply GST on this service</span>

                  {!ex.gstEnabled && (
                    <span className="text-xs text-muted-foreground">
                      (No GST will be charged)
                    </span>
                  )}
                </div>

                {/* DAY SELECTION */}
                {/* DAY SELECTION */}
                {summary.nights > 1 && (
                  <div className="space-y-2">

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">
                        Service Days ({ex.days.length} / {summary.nights})
                      </p>

                      <div className="flex gap-2 text-xs">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const copy = [...extras];
                            copy[idx].days = Array.from(
                              { length: summary.nights },
                              (_, i) => i + 1
                            );
                            setExtras(copy);
                          }}
                        >
                          All Days
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const copy = [...extras];
                            copy[idx].days = [];
                            setExtras(copy);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: summary.nights }).map((_, i) => {
                        const day = i + 1;
                        const checked = ex.days.includes(day);

                        return (
                          <label
                            key={day}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer
              ${checked ? "bg-primary text-primary-foreground" : "bg-background"}
            `}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const copy = [...extras];
                                copy[idx].days = checked
                                  ? ex.days.filter(d => d !== day)
                                  : [...ex.days, day];
                                setExtras(copy);
                              }}
                              className="hidden"
                            />
                            Day {day}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}


              </div>
            ))}

            {/* ADD SERVICE */}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setExtras([
                  ...extras,
                  { name: "", price: "", days: [], gstEnabled: true }
                ])
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Extra Service
            </Button>

          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-lg">

            <p>Nights: <b>{summary.nights}</b></p>
            <p>Room Charges: ₹{summary.roomPrice}</p>
            <p>Extras: ₹{summary.extrasTotal}</p>

            <Label>Discount Applies On</Label>
            <Select
              value={formData.discountScope}
              onValueChange={(v) =>
                setFormData({ ...formData, discountScope: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TOTAL">Total Bill (Room + Extras)</SelectItem>
                <SelectItem value="ROOM">Room Only</SelectItem>
                <SelectItem value="EXTRAS">Extra Services Only</SelectItem>
              </SelectContent>
            </Select>


            <Label>Discount (%)</Label>
            <Input
              type="number"
              value={formData.discount}
              onChange={(e) =>
                setFormData({ ...formData, discount: e.target.value })
              }
            />

            <p>Discount Amount: ₹{summary.discountAmount}</p>

            <Label>Apply GST?</Label>
            <Select
              value={formData.gstEnabled}
              onValueChange={(v) =>
                setFormData({ ...formData, gstEnabled: v })
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex justify-between">
              <span>CGST</span>
              <span>₹{summary.cgst}</span>
            </div>

            <div className="flex justify-between">
              <span>SGST</span>
              <span>₹{summary.sgst}</span>
            </div>

            <Label>Round Off Total?</Label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.roundOffEnabled === "true"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roundOffEnabled: e.target.checked ? "true" : "false",
                  })
                }
              />
              Enable Round Off
            </label>

            {formData.roundOffEnabled === "true" && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Round Off Adjustment</span>
                <span>₹{summary.roundOffAmount}</span>
              </div>
            )}


            <p className="text-xl font-bold">
              Grand Total: ₹{summary.grandTotal}
            </p>

            <Label>Advance Payment Mode</Label>
            <Select
              value={formData.advancePaymentMode}
              onValueChange={(v) =>
                setFormData({ ...formData, advancePaymentMode: v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>


            <Label>Advance Paid</Label>
            <Input
              type="number"
              value={formData.advancePaid}
              onChange={(e) =>
                setFormData({ ...formData, advancePaid: e.target.value })
              }
            />

            <p className="text-2xl font-bold text-primary">
              Balance Due: ₹{summary.balanceDue}
            </p>

          </CardContent>
        </Card>



        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Save />}
          Create Booking
        </Button>

      </form>
    </Layout>
  );
}
