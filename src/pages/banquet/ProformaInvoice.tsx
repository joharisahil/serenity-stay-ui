import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";

import { getBanquetBookingByIdApi } from "@/api/banquetBookingApi";

/* ================= TYPES ================= */

type Booking = {
  customerName: string;
  customerPhone: string;
  eventType: string;
  notes?: string;

  eventDate: string;
  startTime: string;
  endTime: string;

  guestsCount: number;

  hall: {
    name: string;
    baseCharge: number;
    isComplimentary?: boolean;
  };

  pricingMode: "PLAN" | "CUSTOM_FOOD" | "HALL_ONLY";

  plan?: {
    name: string;
    ratePerPerson: number;
  };

  customFoodAmount?: number;

  services?: {
    name: string;
    amount: number;
    chargeable: boolean;
  }[];

  discount?: {
    type: "PERCENT" | "FLAT";
    value: number;
  };

  gstEnabled: boolean;
  gstPercent: number;

  payments?: {
    type: "ADVANCE" | "FINAL";
    amount: number;
    mode: string;
    date: string;
  }[];
};

/* ================= COMPONENT ================= */

export default function ProformaInvoice() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState<Booking | null>(null);

  /* ================= LOAD BOOKING ================= */

  useEffect(() => {
    if (!bookingId) return;

    getBanquetBookingByIdApi(bookingId)
      .then(res => {
        setBooking(res.booking ?? res);
      })
      .catch(() => toast.error("Failed to load booking"));
  }, [bookingId]);

  /* ================= CALCULATIONS ================= */

  if (!booking) {
    return (
      <Layout>
        <div className="p-10 text-center text-muted-foreground">
          Loading proforma invoice...
        </div>
      </Layout>
    );
  }

  const foodAmount =
    booking.pricingMode === "PLAN" && booking.plan
      ? booking.plan.ratePerPerson * booking.guestsCount
      : booking.pricingMode === "CUSTOM_FOOD"
      ? booking.customFoodAmount || 0
      : 0;

  const hallAmount =
    booking.hall && !booking.hall.isComplimentary
      ? booking.hall.baseCharge
      : 0;

  const servicesAmount = (booking.services || [])
    .filter(s => s.chargeable)
    .reduce((sum, s) => sum + s.amount, 0);

  const subTotal = foodAmount + hallAmount + servicesAmount;

  const discountAmount =
    booking.discount?.type === "PERCENT"
      ? (booking.discount.value / 100) * subTotal
      : booking.discount?.value || 0;

  const taxable = Math.max(subTotal - discountAmount, 0);

  const gstAmount = booking.gstEnabled
    ? (taxable * booking.gstPercent) / 100
    : 0;

  const grandTotal = taxable + gstAmount;

  const paidAmount = (booking.payments || []).reduce(
    (s, p) => s + p.amount,
    0
  );

  const balance = grandTotal - paidAmount;

  /* ================= PDF DOWNLOAD ================= */

  const downloadPdf = () => {
    window.print();
  };

  /* ================= UI ================= */

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl mx-auto print:max-w-full">

        {/* ACTIONS */}
        <div className="flex justify-between print:hidden">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>

          <Button onClick={downloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* INVOICE */}
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Proforma Invoice
            </CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              This is not a tax invoice
            </p>
          </CardHeader>

          <CardContent className="space-y-4 text-sm">

            {/* BASIC DETAILS */}
            <div className="grid grid-cols-2 gap-4">
              <p><b>Customer:</b> {booking.customerName}</p>
              <p><b>Phone:</b> {booking.customerPhone}</p>
              <p><b>Event:</b> {booking.eventType}</p>
              <p><b>Guests:</b> {booking.guestsCount}</p>
              <p><b>Hall:</b> {booking.hall.name}</p>
              <p>
                <b>Date:</b>{" "}
                {dayjs(booking.eventDate).format("DD MMM YYYY")} (
                {booking.startTime} – {booking.endTime})
              </p>
            </div>

            {/* PLAN DETAILS */}
            {booking.pricingMode === "PLAN" && booking.plan && (
              <>
                <hr />
                <p className="font-semibold">Selected Plan</p>
                <div className="grid grid-cols-2 gap-4">
                  <p><b>Plan Name:</b> {booking.plan.name}</p>
                  <p><b>Rate / Person:</b> ₹{booking.plan.ratePerPerson}</p>
                  <p><b>Guests:</b> {booking.guestsCount}</p>
                  <p><b>Total Food:</b> ₹{foodAmount}</p>
                </div>
              </>
            )}

            {booking.notes && (
              <>
                <hr />
                <p><b>Notes:</b> {booking.notes}</p>
              </>
            )}

            <hr />

            {/* BILL BREAKUP */}
            <div className="flex justify-between">
              <span>Food Charges</span>
              <span>₹{foodAmount}</span>
            </div>

            <div className="flex justify-between">
              <span>Hall Charges</span>
              <span>₹{hallAmount}</span>
            </div>

            <div className="flex justify-between">
              <span>Services</span>
              <span>₹{servicesAmount}</span>
            </div>

            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span>- ₹{discountAmount}</span>
            </div>

            {booking.gstEnabled && (
              <div className="flex justify-between">
                <span>GST ({booking.gstPercent}%)</span>
                <span>₹{gstAmount}</span>
              </div>
            )}

            <hr />

            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>

            {/* PAYMENTS */}
            {booking.payments && booking.payments.length > 0 && (
              <>
                <hr />
                <p className="font-semibold">Payments</p>

                {booking.payments.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {p.type} ({p.mode}) –{" "}
                      {dayjs(p.date).format("DD MMM YYYY")}
                    </span>
                    <span>₹{p.amount}</span>
                  </div>
                ))}
              </>
            )}

            <hr />

            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>₹{paidAmount}</span>
            </div>

            <div className="flex justify-between text-red-600 font-semibold">
              <span>Balance Due</span>
              <span>₹{balance}</span>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* PRINT STYLE */}
      <style>{`
        @media print {
          body {
            background: white;
          }
        }
      `}</style>
    </Layout>
  );
}
