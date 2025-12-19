// src/pages/ViewBillPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { getBillByIdApi, getRoomBillByIdApi } from "@/api/billApi";

import {
  buildRoomInvoice,
  buildFoodInvoice,
  buildCombinedInvoice,
} from "@/utils/printInvoice";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/* ---------------- PRINT HELPER ---------------- */
const openPrintWindow = (html: string) => {
  const win = window.open("", "_blank", "width=900,height=800");
  if (!win) {
    toast.error("Unable to open print window");
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch {}
  }, 300);
};

export default function ViewBillPage() {
  const { billId, type } = useParams<{ billId: string; type?: string }>();
  const navigate = useNavigate();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceModal, setInvoiceModal] = useState(false);

  /* ---------------- LOAD BILL ---------------- */
  const loadBill = async () => {
    try {
      const data =
        type?.toLowerCase() === "room"
          ? await getRoomBillByIdApi(billId!)
          : await getBillByIdApi(billId!);

      if (!data?.success) {
        toast.error("Bill not found");
        navigate("/old-bills");
        return;
      }

      setBill(data.bill);
    } catch {
      toast.error("Failed to load bill");
      navigate("/old-bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBill();
  }, [billId]);

  if (loading)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">
          Loading bill...
        </p>
      </Layout>
    );

  if (!bill)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">
          Bill not found
        </p>
      </Layout>
    );

  const isRoom = bill.source === "ROOM";
  const full = bill.fullInvoice;

  /* ---------------- BUILD DATA FOR PRINT ---------------- */

  // Booking-like object (used by invoice builders)
  const bookingForPrint = {
    guestName: full.guestName,
    guestPhone: full.guestPhone,

    checkIn: full.checkIn,                      // ✅ real check-in
    checkOut: full.actualCheckoutTime,           // ✅ actual checkout
    actualCheckoutTime: full.actualCheckoutTime,

    room_id: {
      number: full.roomNumber,                  // ✅ real room number
      type: full.roomType,                      // ✅ real room type
    },

    advancePaid: full.advancePaid,
    advancePaymentMode: full.advancePaymentMode,

    finalPaymentReceived: true,
    finalPaymentMode: full.finalPaymentMode,
  };

  const billingData = {
    nights: full.stayNights,
    roomPrice: full.roomRate,
    roomStayTotal: full.stayAmount,
    serviceExtraTotal:
      full.extraServices?.reduce(
        (s: number, e: any) => s + e.price,
        0
      ) || 0,

    roomBase: full.stayAmount,
    roomCGST: full.stayCGST,
    roomSGST: full.staySGST,
    roomGross: full.stayAmount + full.stayGST,

    roomDiscountAmount: full.discountAmount,
    roomNet: full.stayAmount + full.stayGST - full.discountAmount,

    foodSubtotalRaw: full.foodSubtotal,
    foodDiscountAmount: 0,
    foodSubtotalAfterDiscount: full.foodSubtotal,
    foodCGST: full.foodGST / 2,
    foodSGST: full.foodGST / 2,
    foodTotal: full.foodTotal,

    grandTotal: full.totalAmount,
    balance: full.balanceDue,
  };

  /* ================= UI ================= */
  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/old-bills")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">
                Bill #{bill.billNumber}
              </h1>
              <p className="text-muted-foreground">
                Checkout: {new Date(full.actualCheckoutTime).toLocaleString()}
              </p>
            </div>
          </div>

          {isRoom && (
            <Button variant="outline" onClick={() => setInvoiceModal(true)}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          )}
        </div>

        {/* ROOM SUMMARY */}
        {isRoom && (
          <Card>
            <CardHeader>
              <CardTitle>Room Invoice Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <p><b>Guest:</b> {full.guestName}</p>
              <p><b>Phone:</b> {full.guestPhone}</p>
              <p><b>Room:</b> {full.roomNumber} ({full.roomType})</p>
              <p>
                <b>Check-in:</b>{" "}
                {new Date(full.checkIn).toLocaleString()}
              </p>
              <p>
                <b>Check-out:</b>{" "}
                {new Date(full.actualCheckoutTime).toLocaleString()}
              </p>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Room Charges</span>
                  <span>₹{full.stayAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Food Charges</span>
                  <span>₹{full.foodTotal}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>₹{full.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ================= INVOICE DIALOG ================= */}
      {isRoom && full.hotel && (
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Invoice Type</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3">
              <Button
                className="w-full"
                onClick={() =>
                  openPrintWindow(
                    buildRoomInvoice(
                      bookingForPrint,
                      full.hotel,
                      billingData,
                      full.finalPaymentReceived,
                      full.finalPaymentMode
                    )
                  )
                }
              >
                Room Invoice Only
              </Button>

              <Button
                className="w-full"
                disabled={!full.foodOrders?.length}
                onClick={() =>
                  openPrintWindow(
                    buildFoodInvoice(
                      bookingForPrint,
                      full.hotel,
                      billingData,
                      full.foodOrders,
                      full.finalPaymentReceived,
                      full.finalPaymentMode
                    )
                  )
                }
              >
                Food Invoice Only
              </Button>

              <Button
                className="w-full"
                onClick={() =>
                  openPrintWindow(
                    buildCombinedInvoice(
                      bookingForPrint,
                      full.hotel,
                      billingData,
                      full.foodOrders,
                      full.finalPaymentReceived,
                      full.finalPaymentMode
                    )
                  )
                }
              >
                Full Invoice (Room + Food)
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
