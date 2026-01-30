import { Layout } from "@/components/layout/Layout";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getAvailableHallsApi,
  createBanquetBookingApi,
} from "@/api/banquetBookingApi";
import { getPlansApi } from "@/api/banquetPlanApi";

import BookingHeader from "@/components/banquet/BookingHeader";
import CustomerEventCard from "@/components/banquet/CustomerEventCard";
import DateTimeCard from "@/components/banquet/DateTimeCard";
import HallSelectionCard from "@/components/banquet/HallSelectionCard";
import PricingModeCard from "@/components/banquet/PricingModeCard";
import PlanSelectionCard from "@/components/banquet/PlanSelectionCard";
import ServicesCard from "@/components/banquet/ServicesCard";
import PaymentsCard from "@/components/banquet/PaymentsCard";
import BillingSummary from "@/components/banquet/BillingSummary";

/* ================= TYPES ================= */

export type PricingMode = "PLAN" | "CUSTOM_FOOD" | "HALL_ONLY";

export type Hall = {
  _id: string;
  name: string;
  capacity: number;
  pricePerDay: number;
};

export type Plan = {
  _id: string;
  name: string;
  ratePerPerson: number;
};

export type Service = {
  name: string;
  amount: number;
  chargeable: boolean;
};

export type Payment = {
  type: "ADVANCE";
  amount: number;
  mode: string;
  date: string;
};

export type Discount = {
  type: "PERCENT" | "FLAT";
  value: number;
  reason?: string;
};

type CreateBanquetForm = {
  customerName: string;
  customerPhone: string;
  eventType: string;
  notes: string;

  eventDate: string;
  startTime: string;
  endTime: string;

  hallId: string;
  isHallComplimentary: boolean;

  guestsCount: number;
  pricingMode: PricingMode;
  customFoodAmount: number;

  planId: string;

  // ✅ REQUIRED
  discount?: Discount;
  gstEnabled: boolean;
};

/* ================= PAGE ================= */

export default function CreateBanquet() {
  const navigate = useNavigate();

  /* ---------- FORM STATE ---------- */
  const [form, setForm] = useState<CreateBanquetForm>({
    customerName: "",
    customerPhone: "",
    eventType: "",
    notes: "",

    eventDate: "",
    startTime: "",
    endTime: "",

    hallId: "",
    isHallComplimentary: false,

    guestsCount: 0,
    pricingMode: "PLAN",
    customFoodAmount: 0,

    planId: "",
    gstEnabled: false,
    discount: {
    type: "FLAT",
    value: 0,
    reason: "",
  },
  });

  /* ---------- DATA ---------- */
  const [availableHalls, setAvailableHalls] = useState<Hall[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  /* ================= LOAD AVAILABLE HALLS ================= */
  useEffect(() => {
    if (!form.eventDate || !form.startTime || !form.endTime) return;

    getAvailableHallsApi({
      date: form.eventDate,
      startTime: form.startTime,
      endTime: form.endTime,
    })
      .then(res => setAvailableHalls(res.halls))
      .catch(() => toast.error("Failed to load available halls"));
  }, [form.eventDate, form.startTime, form.endTime]);

  /* ================= LOAD PLANS ================= */
  useEffect(() => {
    if (form.pricingMode !== "PLAN") {
      setSelectedPlan(null);
      setForm(f => ({ ...f, planId: "" }));
      return;
    }

    getPlansApi()
      .then(res => setPlans(res.plans.filter((p: any) => p.isActive)))
      .catch(() => toast.error("Failed to load plans"));
  }, [form.pricingMode]);

  /* ================= SUBMIT ================= */
  const submitBooking = async () => {
    try {
      await createBanquetBookingApi({
        ...form,
        services,
        payments,
        discount: form.discount?.value ? form.discount : undefined,
      });

      toast.success("Banquet booking created");
      navigate("/banquet");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create booking");
    }
  };

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT – FORM */}
        <div className="lg:col-span-8 space-y-6">
          <BookingHeader />

          <CustomerEventCard form={form} setForm={setForm} />
          <DateTimeCard form={form} setForm={setForm} />

          <HallSelectionCard
            form={form}
            setForm={setForm}
            halls={availableHalls}
          />

          <PricingModeCard form={form} setForm={setForm} />

          {form.pricingMode === "PLAN" && (
            <PlanSelectionCard
              plans={plans}
              form={form}
              setForm={setForm}
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
            />
          )}

          <ServicesCard
            services={services}
            setServices={setServices}
          />

          <PaymentsCard
            payments={payments}
            setPayments={setPayments}
          />

          <div className="flex flex-col sm:flex-row justify-end gap-4">
  <Button
    variant="outline"
    onClick={() => navigate("/banquet")}
    className="w-full sm:w-auto"
  >
    Cancel
  </Button>

  <Button
    onClick={submitBooking}
    className="w-full sm:w-auto"
  >
    Create Booking
  </Button>
</div>

        </div>

        {/* RIGHT – BILLING SUMMARY */}
        <div className="lg:col-span-4">
          <BillingSummary
            form={form}
            setForm={setForm}
            selectedPlan={selectedPlan}
            halls={availableHalls}
            services={services}
            payments={payments}
          />
        </div>
      </div>
    </Layout>
  );
}
