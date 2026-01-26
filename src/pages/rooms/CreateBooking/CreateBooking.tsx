import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Layout } from "@/components/layout/Layout";
import { SectionCard } from "./components/SectionCard";
import { StayDurationBar } from "./components/StayDurationBar";
import { RoomSelector } from "./components/RoomSelector";
import { GuestForm } from "./components/GuestForm";
import { CompanyForm } from "./components/CompanyForm";
import { IdProofSection } from "./components/IdProofSection";
import { ExtraServicesSection } from "./components/ExtraServicesSection";
import { BillingSummary } from "./components/BillingSummary";
import { useGuestSearch } from "./hooks/useGuestSearch";
import {
  getRoomTypesApi,
  getAvailableRoomsByDateTimeApi,
  createBookingApi,
} from "@/api/bookingApi";
import { getRoomPlansApi } from "@/api/roomApi";

export default function CreateBooking() {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    roomType: "",
    roomNumber: "",
    planCode: "",
    
    finalRoomPrice: "",
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
    discountAmountInput: "",
    discountScope: "TOTAL",
    gstEnabled: "true",
    roundOffEnabled: "true",
    advanceAmount: "",
    advancePaymentMode: "CASH",
    notes: "",
  });
  // 🔍 Guest search (autocomplete)
  const {
    results: guestSuggestions,
    activeField,
    setActiveField,
    clearResults,
  } = useGuestSearch(formData.guestName, formData.guestPhone);

  const [guestIds, setGuestIds] = useState<
    { type: string; idNumber: string; nameOnId: string }[]
  >([]);
  const [extras, setExtras] = useState<
    { name: string; price: string; days: number[]; gstEnabled: boolean }[]
  >([]);

  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<
    { _id: string; number: string; status?: string; type?: string }[]
  >([]);
  const [plans, setPlans] = useState<
    { key: string; label: string; price: number; meals?: string }[]
  >([]);
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
  const isSpecialPricing = Number(formData.finalRoomPrice) > 0;

  const toUTCISOString = (localDateTime: string) => {
    const [date, time] = localDateTime.split("T");
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const local = new Date(y, m - 1, d, hh, mm);
    return local.toISOString();
  };

  // Load room types on mount
  useEffect(() => {
    getRoomTypesApi()
      .then(setRoomTypes)
      .catch(() => toast.error("Failed to load room types"));
  }, []);

  // Load rooms when dates and room type selected
  useEffect(() => {
    if (!staySelected || !formData.roomType) return;

    getAvailableRoomsByDateTimeApi(
      formData.checkIn,
      formData.checkOut,
      formData.roomType,
    )
      .then(setRooms)
      .catch(() => toast.error("Failed to load rooms"));
  }, [staySelected, formData.roomType, formData.checkIn, formData.checkOut]);

  // Load plans when room is selected
  useEffect(() => {
    if (!formData.roomNumber) return;

    getRoomPlansApi(formData.roomNumber)
      .then(setPlans)
      .catch(() => toast.error("Failed to load plans"));
  }, [formData.roomNumber]);

  // Bill calculation
  useEffect(() => {
    if (!staySelected) return;

    const inDT = new Date(formData.checkIn);
    const outDT = new Date(formData.checkOut);
    const nights = Math.max(
      1,
      Math.ceil((outDT.getTime() - inDT.getTime()) / 86400000),
    );

    const plan = plans.find((p) => p.key === formData.planCode);

    let roomBase = 0;
    let roomGSTFromRoom = 0;

    if (isSpecialPricing) {
      // finalRoomPrice is per-night & GST inclusive
      const finalPerNight = Number(formData.finalRoomPrice || 0);

      const basePerNight = +(finalPerNight / 1.05).toFixed(2);
      const gstPerNight = +(finalPerNight - basePerNight).toFixed(2);

      roomBase = basePerNight * nights;
      roomGSTFromRoom = gstPerNight * nights;
    } else {
      roomBase = plan ? plan.price * nights : 0;
    }

    let extrasBaseGST = 0;
    let extrasBaseNoGST = 0;

    extras.forEach((ex) => {
      const days = ex.days.length
        ? ex.days
        : Array.from({ length: nights }, (_, i) => i + 1);
      const amount = Number(ex.price || 0) * days.length;
      if (ex.gstEnabled) extrasBaseGST += amount;
      else extrasBaseNoGST += amount;
    });

    const discountPercent = Number(formData.discount || 0);
    const discountAmountFlat = Number(formData.discountAmountInput || 0);

    let discountedRoomBase = roomBase;
    let discountedExtrasGST = extrasBaseGST;
    let discountedExtrasNoGST = extrasBaseNoGST;
    let discountAmount = 0;

    if (discountAmountFlat > 0) {
      const grossBase = roomBase + extrasBaseGST + extrasBaseNoGST;
      if (formData.discountScope === "TOTAL") {
        discountAmount = Math.min(discountAmountFlat, grossBase);
        if (grossBase > 0) {
          discountedRoomBase -= (discountAmount * roomBase) / grossBase;
          discountedExtrasGST -= (discountAmount * extrasBaseGST) / grossBase;
          discountedExtrasNoGST -=
            (discountAmount * extrasBaseNoGST) / grossBase;
        }
      } else if (formData.discountScope === "ROOM") {
        discountAmount = Math.min(discountAmountFlat, roomBase);
        discountedRoomBase -= discountAmount;
      } else if (formData.discountScope === "EXTRAS") {
        const extrasBase = extrasBaseGST + extrasBaseNoGST;
        discountAmount = Math.min(discountAmountFlat, extrasBase);
        if (extrasBase > 0) {
          discountedExtrasGST -= (discountAmount * extrasBaseGST) / extrasBase;
          discountedExtrasNoGST -=
            (discountAmount * extrasBaseNoGST) / extrasBase;
        }
      }
    } else if (discountPercent > 0) {
      const grossBase = roomBase + extrasBaseGST + extrasBaseNoGST;
      if (formData.discountScope === "TOTAL") {
        discountAmount = +((grossBase * discountPercent) / 100).toFixed(2);
        if (grossBase > 0) {
          discountedRoomBase -= (discountAmount * roomBase) / grossBase;
          discountedExtrasGST -= (discountAmount * extrasBaseGST) / grossBase;
          discountedExtrasNoGST -=
            (discountAmount * extrasBaseNoGST) / grossBase;
        }
      } else if (formData.discountScope === "ROOM") {
        discountAmount = +((roomBase * discountPercent) / 100).toFixed(2);
        discountedRoomBase -= discountAmount;
      } else if (formData.discountScope === "EXTRAS") {
        const extrasBase = extrasBaseGST + extrasBaseNoGST;
        discountAmount = +((extrasBase * discountPercent) / 100).toFixed(2);
        if (extrasBase > 0) {
          discountedExtrasGST -= (discountAmount * extrasBaseGST) / extrasBase;
          discountedExtrasNoGST -=
            (discountAmount * extrasBaseNoGST) / extrasBase;
        }
      }
    }

    let gstTotal = 0;
    if (formData.gstEnabled === "true") {
      gstTotal += isSpecialPricing
        ? roomGSTFromRoom
        : +(discountedRoomBase * 0.05).toFixed(2);

      gstTotal += +(discountedExtrasGST * 0.05).toFixed(2);
    }

    const cgst = +(gstTotal / 2).toFixed(2);
    const sgst = +(gstTotal / 2).toFixed(2);

    let grandTotal =
      discountedRoomBase +
      discountedExtrasGST +
      discountedExtrasNoGST +
      gstTotal;

    let roundOffAmount = 0;
    if (formData.roundOffEnabled === "true") {
      const rounded = Math.round(grandTotal);
      roundOffAmount = +(rounded - grandTotal).toFixed(2);
      grandTotal = rounded;
    }

    const advance = Number(formData.advanceAmount || 0);

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
  }, [staySelected, formData, extras, plans]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Normalize discount to percentage
      let finalDiscountPercent = Number(formData.discount || 0);

      if (
        !finalDiscountPercent &&
        Number(formData.discountAmountInput || 0) > 0
      ) {
        const grossBase = summary.taxable + summary.discountAmount;
        if (grossBase > 0) {
          finalDiscountPercent = +(
            (Number(formData.discountAmountInput) / grossBase) *
            100
          ).toFixed(2);
        }
      }

      await createBookingApi({
        room_id: formData.roomNumber,
        checkIn: toUTCISOString(formData.checkIn),
        checkOut: toUTCISOString(formData.checkOut),

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
         pricingMode: isSpecialPricing ? "SPECIAL" : "PLAN",
  pricingType: isSpecialPricing ? "FINAL_INCLUSIVE" : "BASE_EXCLUSIVE",
        finalRoomPrice: isSpecialPricing
          ? Number(formData.finalRoomPrice)
          : undefined,
        gstEnabled: formData.gstEnabled === "true",
        roundOffEnabled: formData.roundOffEnabled === "true",
        roundOffAmount: summary.roundOffAmount,

        discount: finalDiscountPercent,

        advanceAmount: Number(formData.advanceAmount || 0),
        advancePaymentMode: formData.advancePaymentMode,

        guestIds,
        addedServices: extras.map((e) => ({
          name: e.name,
          price: Number(e.price),
          days: e.days.length ? e.days : undefined,
          gstEnabled: e.gstEnabled,
        })),

        notes: formData.notes,
      });

      toast.success("Booking created successfully");
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Create Room Booking</h1>
            <p className="text-xs text-muted-foreground">New reservation</p>
          </div>
        </div>

        <Button type="submit" form="booking-form" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Booking
        </Button>
      </div>

      <form id="booking-form" onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Form Sections (70%) */}
          <div className="flex-1 lg:w-[70%] space-y-4">
            {/* Section 1: Stay & Room Selection */}
            <SectionCard number={1} title="Stay & Room Selection">
              <div className="space-y-4">
                {/* Date Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="erp-field">
                    <Label className="erp-label erp-required">
                      <CalendarDays className="inline h-3.5 w-3.5 mr-1" />
                      Check-in Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.checkIn}
                      onChange={(e) =>
                        updateFormData({ checkIn: e.target.value })
                      }
                    />
                  </div>
                  <div className="erp-field">
                    <Label className="erp-label erp-required">
                      <CalendarDays className="inline h-3.5 w-3.5 mr-1" />
                      Check-out Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={formData.checkOut}
                      onChange={(e) =>
                        updateFormData({ checkOut: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Stay Duration Bar */}
                {staySelected && (
                  <StayDurationBar
                    checkIn={formData.checkIn}
                    checkOut={formData.checkOut}
                    nights={summary.nights}
                  />
                )}

                {/* Room Selection */}
                <RoomSelector
                  roomTypes={roomTypes}
                  rooms={rooms}
                  plans={plans}
                  selectedRoomType={formData.roomType}
                  selectedRoom={formData.roomNumber}
                  selectedPlan={formData.planCode}
                  disabled={!staySelected}
                  onRoomTypeChange={(v) =>
                    updateFormData({
                      roomType: v,
                      roomNumber: "",
                      planCode: "",
                    })
                  }
                  onRoomChange={(v) =>
                    updateFormData({ roomNumber: v, planCode: "" })
                  }
                  onPlanChange={(v) => updateFormData({ planCode: v })}
                />
              </div>
            </SectionCard>

            {/* Section 2: Guest Information */}
            {/* <SectionCard number={2} title="Guest Information" disabled={!staySelected}>
              <GuestForm
                formData={{
                  guestName: formData.guestName,
                  guestPhone: formData.guestPhone,
                  guestCity: formData.guestCity,
                  guestNationality: formData.guestNationality,
                  guestAddress: formData.guestAddress,
                  adults: formData.adults,
                  children: formData.children,
                }}
                onChange={updateFormData}
              />
            </SectionCard> */}
            {/* Section 2: Guest Information */}
            <SectionCard
              number={2}
              title="Guest Information"
              disabled={!staySelected}
            >
              <GuestForm
                formData={{
                  guestName: formData.guestName,
                  guestPhone: formData.guestPhone,
                  guestCity: formData.guestCity,
                  guestNationality: formData.guestNationality,
                  guestAddress: formData.guestAddress,
                  adults: formData.adults,
                  children: formData.children,
                }}
                onChange={updateFormData}
                // 🔽 NEW PROPS for autocomplete
                suggestions={guestSuggestions}
                activeField={activeField}
                onFieldFocus={setActiveField}
                onSelectGuest={(g) => {
                  updateFormData({
                    guestName: g.guestName,
                    guestPhone: g.guestPhone,
                    guestCity: g.guestCity || "",
                    guestNationality: g.guestNationality || "Indian",
                    guestAddress: g.guestAddress || "",
                    adults: String(g.adults || 1),
                    children: String(g.children || 0),

                    // company auto-fill
                    companyName: g.companyName || "",
                    companyGSTIN: g.companyGSTIN || "",
                    companyAddress: g.companyAddress || "",
                  });
                  setGuestIds(g.guestIds || []);

                  clearResults();
                }}
              />
            </SectionCard>

            {/* Section 3: Company / GST Details */}
            <SectionCard
              number={3}
              title="Company / GST Details (Optional)"
              disabled={!staySelected}
            >
              <CompanyForm
                formData={{
                  companyName: formData.companyName,
                  companyGSTIN: formData.companyGSTIN,
                  companyAddress: formData.companyAddress,
                }}
                onChange={updateFormData}
              />
            </SectionCard>

            {/* Section 4: ID Proofs */}
            <SectionCard number={4} title="ID Proofs" disabled={!staySelected}>
              <IdProofSection idProofs={guestIds} onChange={setGuestIds} />
            </SectionCard>

            {/* Section 5: Extra Services */}
            <SectionCard
              number={5}
              title="Extra Services"
              disabled={!staySelected}
            >
              <ExtraServicesSection
                services={extras}
                nights={summary.nights}
                onChange={setExtras}
              />
            </SectionCard>

            {/* Section 6: Notes */}
            <SectionCard
              number={6}
              title="Booking Notes"
              disabled={!staySelected}
            >
              <div className="erp-field">
                <Label className="erp-label">Special Requests / Notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Any special requests or internal notes..."
                  value={formData.notes}
                  onChange={(e) => updateFormData({ notes: e.target.value })}
                />
              </div>
            </SectionCard>
          </div>

          {/* Right Column - Billing Summary (30%) */}
          <div className="lg:w-[30%]">
            <BillingSummary
              summary={summary}
              formData={{
                discount: formData.discount,
                discountAmountInput: formData.discountAmountInput,
                discountScope: formData.discountScope,
                gstEnabled: formData.gstEnabled,
                roundOffEnabled: formData.roundOffEnabled,
                advanceAmount: formData.advanceAmount,
                advancePaymentMode: formData.advancePaymentMode,
                finalRoomPrice :formData.finalRoomPrice,
              }}
              onFormChange={updateFormData}
            />
          </div>
        </div>
      </form>
    </Layout>
  );
}
