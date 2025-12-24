// src/pages/ViewBillPage.tsx
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
    } catch {}
  }, 300);
};

/* ---------------- THERMAL RESTAURANT BILL ---------------- */
const buildRestaurantThermalBill = (bill: any, hotel?: any) => {
  const items = bill.orders?.flatMap((o: any) => o.items) || [];

  const totalPaid = Array.isArray(bill.payments)
    ? bill.payments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    : bill.finalAmount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
 <style>
  @page {
    size: 80mm auto;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  body {
    font-family: monospace;
    font-size: 12px;
    display: flex;
    justify-content: center;
  }

  .bill {
    width: 80mm;
    padding: 8px;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }
  .small { font-size: 11px; }

  .line {
    border-top: 1px dashed #000;
    margin: 6px 0;
  }

  .row {
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
 <div class="bill">
  <!-- HOTEL HEADER -->
  <div class="center bold">${hotel?.name || "RESTAURANT"}</div>
  ${hotel?.address ? `<div class="center small">${hotel.address}</div>` : ""}
  ${hotel?.phone ? `<div class="center small">Ph: ${hotel.phone}</div>` : ""}
  ${hotel?.gstNumber ? `<div class="center small">GSTIN: ${hotel.gstNumber}</div>` : ""}

  <div class="line"></div>

  <!-- BILL INFO -->
  <div class="row"><span>Bill No</span><span>${bill.billNumber}</span></div>
  <div class="row"><span>Date</span><span>${new Date(bill.createdAt).toLocaleString()}</span></div>

  ${bill.table?.name ? `<div class="row"><span>Table</span><span>${bill.table.name}</span></div>` : ""}

  <div class="line"></div>

  <!-- CUSTOMER -->
  <div><b>Customer</b></div>
  <div class="small">${bill.customerName || "N/A"}</div>
  <div class="small">${bill.customerPhone || ""}</div>
  ${bill.customerCompanyName
  ? `<div class="small">Company: ${bill.customerCompanyName}</div>`
  : ""}

  ${bill.customerCompanyGSTIN
  ? `<div class="small">GSTIN: ${bill.customerCompanyGSTIN}</div>`
  : ""}

  <div class="line"></div>

  <!-- ITEMS -->
  ${items.map((it: any) => `
    <div class="row">
      <span>${it.name} x ${it.qty}</span>
      <span>₹${it.totalPrice}</span>
    </div>
  `).join("")}

  <div class="line"></div>

  <!-- TOTALS -->
  <div class="row"><span>Subtotal</span><span>₹${bill.subtotal}</span></div>

  ${bill.discount > 0 ? `
    <div class="row"><span>Discount</span><span>-₹${bill.discount}</span></div>
  ` : ""}

  <div class="row"><span>CGST (2.5%)</span><span>₹${(bill.gst / 2).toFixed(2)}</span></div>
  <div class="row"><span>SGST (2.5%)</span><span>₹${(bill.gst / 2).toFixed(2)}</span></div>

  <div class="line"></div>

  <div class="row bold"><span>TOTAL</span><span>₹${bill.finalAmount}</span></div>

  <div class="line"></div>

  <!-- PAYMENTS -->
  <div><b>Payment</b></div>

  ${
    Array.isArray(bill.payments) && bill.payments.length > 0
      ? bill.payments.map((p: any) => `
          <div class="row">
            <span>${p.mode}</span>
            <span>₹${p.amount}</span>
          </div>
        `).join("")
      : `<div class="row"><span>${bill.paymentMode}</span><span>₹${bill.finalAmount}</span></div>`
  }

  <div class="row bold"><span>Paid</span><span>₹${totalPaid}</span></div>

  <div class="line"></div>

  <!-- FOOTER -->
  <div class="center">Thank You 🙏</div>
  <div class="center small">Visit Again</div>
 </div>
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

  useEffect(() => {
    (async () => {
      try {
        const res =
          type?.toLowerCase() === "room"
            ? await getRoomBillByIdApi(billId!)
            : await getBillByIdApi(billId!);

        if (!res?.success) throw new Error();
        setBill(res.bill);
      } catch {
        toast.error("Failed to load bill");
        navigate("/old-bills");
      } finally {
        setLoading(false);
      }
    })();
  }, [billId]);

  if (loading)
    return (
      <Layout>
        <p className="p-10 text-center text-muted-foreground">Loading bill…</p>
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
  const hotel = bill.hotel;
  const bookingInfo = bill.bookingInfo;

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

          {!isRoom && (
            <Button
              variant="outline"
              onClick={() => openPrintWindow(buildRestaurantThermalBill(bill, hotel))}
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Bill
            </Button>
          )}

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
            <CardHeader><CardTitle>Restaurant Bill</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p><b>Customer Name:</b> {bill.customerName || "N/A"}</p>
              <p><b>Customer Phone:</b> {bill.customerPhone || "N/A"}</p>
              {bill.customerCompanyName && (
                <p><b>Company:</b> {bill.customerCompanyName}</p>
              )}

              {bill.customerCompanyGSTIN && (
                <p><b>GSTIN:</b> {bill.customerCompanyGSTIN}</p>
              )}

              {/* ITEMS */}
              <div className="border rounded p-3 space-y-1">
                {bill.orders?.flatMap((o: any) =>
                  o.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{it.name} × {it.qty}</span>
                      <span>₹{it.totalPrice}</span>
                    </div>
                  ))
                )}
              </div>

              {/* TOTALS */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{bill.subtotal}</span>
                </div>

                {bill.discount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span>-₹{bill.discount}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>₹{(bill.gst / 2).toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>₹{(bill.gst / 2).toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>₹{bill.finalAmount}</span>
                </div>
              </div>

              {/* PAYMENT SUMMARY */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <p className="font-semibold">Payment Summary</p>

                {Array.isArray(bill.payments) && bill.payments.length > 0 ? (
                  <>
                    {bill.payments.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span>{p.mode}</span>
                        <span>₹{p.amount}</span>
                      </div>
                    ))}

                    <div className="flex justify-between font-bold border-t pt-1">
                      <span>Total Paid</span>
                      <span>
                        ₹{bill.payments.reduce(
                          (sum: number, p: any) => sum + Number(p.amount || 0),
                          0
                        )}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between">
                    <span>Payment Mode</span>
                    <span>{bill.paymentMode}</span>
                  </div>
                )}
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

            <CardContent className="space-y-4 text-sm">
              {/* GUEST INFO */}
              <div>
                <p className="font-semibold mb-1">Guest Information</p>
                <p><b>Name:</b> {full.guestName}</p>
                <p><b>Phone:</b> {full.guestPhone}</p>
              </div>

              {/* STAY INFO */}
              <div>
                <p className="font-semibold mb-1">Stay Details</p>
                <p><b>Room:</b> {full.room_id?.number} ({full.room_id?.type})</p>
                <p><b>Check-in:</b> {new Date(bookingInfo?.checkIn || full.createdAt).toLocaleString()}</p>
                <p><b>Check-out:</b> {new Date(full.actualCheckoutTime).toLocaleString()}</p>
                <p><b>Nights:</b> {full.stayNights}</p>
              </div>

              {/* ROOM CHARGES */}
              <div>
                <p className="font-semibold mb-1">Room Charges</p>
                <div className="flex justify-between">
                  <span>Room Rate</span>
                  <span>₹{full.roomRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stay Amount</span>
                  <span>₹{full.stayAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span>₹{full.stayCGST}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span>₹{full.staySGST}</span>
                </div>
              </div>

              {/* FOOD CHARGES */}
              <div>
                <p className="font-semibold mb-1">Food Charges</p>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{full.foodSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>₹{full.foodGST}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>₹{full.foodTotal}</span>
                </div>
              </div>

              {/* DISCOUNT */}
              {full.discountAmount > 0 && (
                <div>
                  <p className="font-semibold mb-1">Discount</p>
                  <div className="flex justify-between">
                    <span>{full.discountPercent}%</span>
                    <span>-₹{full.discountAmount}</span>
                  </div>
                </div>
              )}

              {/* PAYMENT INFO */}
              <div>
                <p className="font-semibold mb-1">Payment Summary</p>
                <div className="flex justify-between">
                  <span>Advance Paid</span>
                  <span>₹{full.advancePaid}</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Mode</span>
                  <span>{bookingInfo?.advancePaymentMode || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due</span>
                  <span>₹{full.balanceDue}</span>
                </div>
              </div>

              {/* FINAL TOTAL */}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total Amount</span>
                <span>₹{full.totalAmount}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ROOM INVOICE MODAL */}
      {isRoom && full && hotel && (
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Invoice Type</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  openPrintWindow(
                    buildRoomInvoice(full, hotel, bookingInfo, true, bookingInfo?.advancePaymentMode)
                  );
                  setInvoiceModal(false);
                }}
              >
                Room Invoice Only
              </Button>

              <Button
                className="w-full"
                disabled={!full.foodOrders?.length}
                onClick={() => {
                  openPrintWindow(
                    buildFoodInvoice(full, hotel, bookingInfo, full.foodOrders, true, bookingInfo?.advancePaymentMode)
                  );
                  setInvoiceModal(false);
                }}
              >
                Food Invoice Only
              </Button>

              <Button
                className="w-full"
                onClick={() => {
                  openPrintWindow(
                    buildCombinedInvoice(full, hotel, bookingInfo, full.foodOrders, true, bookingInfo?.advancePaymentMode)
                  );
                  setInvoiceModal(false);
                }}
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