import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
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
  const win = window.open("", "_blank", "width=400,height=700");
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
    } catch { }
  }, 300);
};

/* ---------------- THERMAL BILL BUILDER ---------------- */
const buildRestaurantThermalBill = (bill: any) => {
  const items = bill.orders?.flatMap((o: any) => o.items) || [];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Restaurant Bill</title>
  <style>
    body {
      font-family: monospace;
      width: 58mm;
      padding: 8px;
      font-size: 12px;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; }
  </style>
</head>
<body>

  <div class="center bold">RESTAURANT BILL</div>
  <div class="center">Bill No: ${bill.billNumber}</div>
  <div class="center">${new Date(bill.createdAt).toLocaleString()}</div>

  <div class="line"></div>

  ${items
      .map(
        (it: any) => `
    <div class="row">
      <span>${it.name} × ${it.qty}</span>
      <span>₹${it.total}</span>
    </div>
  `
      )
      .join("")}

  <div class="line"></div>

  <div class="row">
  <span>Subtotal</span>
  <span>₹${bill.subtotal}</span>
</div>

<div class="row">
  <span>CGST (2.5%)</span>
  <span>₹${(bill.gst / 2).toFixed(2)}</span>
</div>

<div class="row">
  <span>SGST (2.5%)</span>
  <span>₹${(bill.gst / 2).toFixed(2)}</span>
</div>

<div class="row bold">
  <span>TOTAL</span>
  <span>₹${bill.finalAmount}</span>
</div>

  <div class="line"></div>

  <div class="center">Thank You 🙏</div>

</body>
</html>
`;
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
      const res =
        type?.toLowerCase() === "room"
          ? await getRoomBillByIdApi(billId!)
          : await getBillByIdApi(billId!);

      if (!res?.success) {
        toast.error("Bill not found");
        navigate("/old-bills");
        return;
      }

      setBill(res.bill);
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
        <p className="p-10 text-center text-muted-foreground">Loading bill...</p>
      </Layout>
    );

  if (!bill)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Bill not found</p>
      </Layout>
    );

  const isRoom = bill.source === "ROOM";
  const full = isRoom ? bill.fullInvoice : null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/old-bills")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">Bill #{bill.billNumber}</h1>
              <p className="text-muted-foreground">
                {new Date(bill.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* RESTAURANT THERMAL PRINT */}
          {!isRoom && (
            <Button
              variant="outline"
              onClick={() =>
                openPrintWindow(buildRestaurantThermalBill(bill))
              }
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Bill
            </Button>
          )}

          {/* ROOM INVOICE */}
          {isRoom && (
            <Button variant="outline" onClick={() => setInvoiceModal(true)}>
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
          )}
        </div>

        {/* RESTAURANT BILL */}
        {!isRoom && (
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Bill</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p><b>Customer:</b> {bill.customerName || "N/A"}</p>

              <div className="border rounded-lg p-4 space-y-2">
                {bill.orders?.flatMap((o: any) =>
                  o.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{it.name} × {it.qty}</span>
                      <span>₹{it.total}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>₹{(bill.gst / 2).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>₹{(bill.gst / 2).toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{bill.finalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ROOM BILL SUMMARY */}
        {isRoom && full && (
          <Card>
            <CardHeader>
              <CardTitle>Room Invoice Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <p><b>Guest:</b> {full.guestName}</p>
              <p><b>Room:</b> {full.roomNumber} ({full.roomType})</p>
              <p><b>Check-out:</b> {new Date(full.actualCheckoutTime).toLocaleString()}</p>
              <p className="font-bold">Total: ₹{full.totalAmount}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ROOM INVOICE MODAL */}
      {isRoom && full?.hotel && (
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Invoice Type</DialogTitle>
            </DialogHeader>

            <Button
              onClick={() =>
                openPrintWindow(
                  buildCombinedInvoice(
                    {
                      ...full,
                      room_id: {
                        number: full.roomNumber,
                        type: full.roomType,
                      },
                    },
                    full.hotel,
                    {
                      nights: full.stayNights,
                      roomPrice: full.roomRate,
                      roomStayTotal: full.stayAmount,
                      roomBase: full.stayAmount,
                      roomCGST: full.stayCGST,
                      roomSGST: full.staySGST,
                      roomGross: full.stayAmount + full.stayGST,
                      roomDiscountAmount: full.discountAmount,
                      roomNet: full.totalAmount - full.foodTotal,
                      foodSubtotalRaw: full.foodSubtotal,
                      foodCGST: full.foodGST / 2,
                      foodSGST: full.foodGST / 2,
                      foodTotal: full.foodTotal,
                      grandTotal: full.totalAmount,
                      balance: full.balanceDue,
                    },
                    full.foodOrders,
                    true,
                    full.advancePaymentMode || "CASH"
                  )
                )
              }
            >
              Full Invoice (Room + Food)
            </Button>

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
