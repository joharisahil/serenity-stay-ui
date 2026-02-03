// src/pages/ViewBillPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { toast } from "sonner";

import { getBillByIdApi, getRoomBillByIdApi } from "@/api/billApi";

import { buildRoomInvoice, buildFoodInvoice } from "@/utils/printInvoice";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { mapRoomInvoice } from "@/utils/mapInvoice";
import {
  buildCombinedInvoice_old,
  buildRoomInvoice_old,
} from "@/utils/invoiceBuilders";

const formatLocal = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

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
  <div class="row"><span>Date</span><span>${formatLocal(bill.createdAt)}</span></div>

  ${bill.table?.name ? `<div class="row"><span>Table</span><span>${bill.table.name}</span></div>` : ""}

  <div class="line"></div>

  <!-- CUSTOMER -->
  <div><b>Customer</b></div>
  <div class="small">${bill.customerName || "N/A"}</div>
  <div class="small">${bill.customerPhone || ""}</div>
  ${
    bill.customerCompanyName
      ? `<div class="small">Company: ${bill.customerCompanyName}</div>`
      : ""
  }

  ${
    bill.customerCompanyGSTIN
      ? `<div class="small">GSTIN: ${bill.customerCompanyGSTIN}</div>`
      : ""
  }

  <div class="line"></div>

  <!-- ITEMS -->
  ${items
    .map(
      (it: any) => `
    <div class="row">
      <span>${it.name} x ${it.qty}</span>
      <span>₹${it.totalPrice}</span>
    </div>
  `,
    )
    .join("")}

  <div class="line"></div>

  <!-- TOTALS -->
  <div class="row"><span>Subtotal</span><span>₹${bill.subtotal}</span></div>

  ${
    bill.discount > 0
      ? `
    <div class="row"><span>Discount</span><span>-₹${bill.discount}</span></div>
  `
      : ""
  }

  <div class="row"><span>CGST (2.5%)</span><span>₹${(bill.gst / 2).toFixed(2)}</span></div>
  <div class="row"><span>SGST (2.5%)</span><span>₹${(bill.gst / 2).toFixed(2)}</span></div>

  <div class="line"></div>

  <div class="row bold"><span>TOTAL</span><span>₹${bill.finalAmount}</span></div>

  <div class="line"></div>

  <!-- PAYMENTS -->
  <div><b>Payment</b></div>

  ${
    Array.isArray(bill.payments) && bill.payments.length > 0
      ? bill.payments
          .map(
            (p: any) => `
          <div class="row">
            <span>${p.mode}</span>
            <span>₹${p.amount}</span>
          </div>
        `,
          )
          .join("")
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

  // Transform fullInvoice to match the format expected by print functions
  // ---------- helpers ----------
  // ---------- helpers ----------
  const safe = (n: any) => Number(n) || 0;

  // ---------- derive from BACKEND LEGACY FIELDS ----------
  const totalTaxable = full ? safe(full.taxable ?? full.stayAmount) : 0;

  const cgst = full ? safe(full.cgst ?? full.stayCGST) : 0;

  const sgst = full ? safe(full.sgst ?? full.staySGST) : 0;

  const totalGST = cgst + sgst;
  const roomNet = totalTaxable + totalGST;

  // ---------- basic stay data ----------
  const nights = full ? full.stayNights : 0;
  const roomPrice = full ? full.roomRate : 0;
  const roomStayTotal = full ? full.stayAmount : 0;
  //0nly used in food orders
  const transformedBooking = full
    ? {
        ...full,

        pricingType: full.pricingType ?? "NORMAL",

        finalRoomPrice:
          full.finalRoomPrice ??
          (typeof full.roomGross === "number" ? full.roomGross : undefined),

        planCode: full.planCode,

        room_id: {
          ...(full.room_id || {}),
          plans: full.room_id?.plans || [
            {
              code: full.planCode?.split("_")[0],
              singlePrice: roomPrice,
              doublePrice: roomPrice,
            },
          ],
        },

        // 👇 legacy fields expected by invoice
        stayAmount: full.stayAmount,

        stayCGST: cgst,
        staySGST: sgst,
        stayGST: totalGST,

        roomGross: roomNet,
        roomNet: roomNet,
        totalAmount: roomNet,

        // backend truth
        taxable: full.taxable,
        cgst: full.cgst,
        sgst: full.sgst,
        grandTotal: roomNet,

        addedServices: full.extraServices || [],

        foodTotals: {
          subtotal: full.foodSubtotalRaw,
          gst: full.foodGST,
          total: full.foodTotal,
        },

        discount: full.discountPercent,
        discountAmount: full.discountAmount,

        advancePaid: full.advancePaid,
        balanceDue: full.balanceDue,

        finalPaymentReceived: full.finalPaymentReceived,
        finalPaymentMode: full.finalPaymentMode,
      }
    : null;

  // Calculate billing data for display (matching the logic from BookingDetails)

  const billingData = full
    ? {
        nights,
        roomPrice,
        roomStayTotal,

        roomBase: totalTaxable,
        roomCGST: cgst,
        roomSGST: sgst,
        roomGross: roomNet,
        roomNet: roomNet,

        foodSubtotalRaw: safe(full.foodSubtotalRaw),
        foodDiscountAmount: safe(full.foodDiscountAmount),
        foodSubtotalAfterDiscount: safe(full.foodSubtotalAfterDiscount),
        foodCGST: safe(full.foodCGST),
        foodSGST: safe(full.foodSGST),
        foodTotal: safe(full.foodTotal),

        grandTotal: roomNet,
        balance: safe(full.balanceDue),
      }
    : null;

  const mappedInvoice = isRoom ? mapRoomInvoice(bill) : null;

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
              <h1 className="text-3xl font-bold">Bill #{bill.billNumber}</h1>
              <p className="text-muted-foreground">
                {formatLocal(bill.createdAt)}
              </p>
            </div>
          </div>

          {!isRoom && (
            <Button
              variant="outline"
              onClick={() =>
                openPrintWindow(buildRestaurantThermalBill(bill, hotel))
              }
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
            <CardHeader>
              <CardTitle>Restaurant Bill</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                <b>Customer Name:</b> {bill.customerName || "N/A"}
              </p>
              <p>
                <b>Customer Phone:</b> {bill.customerPhone || "N/A"}
              </p>
              {bill.customerCompanyName && (
                <p>
                  <b>Company:</b> {bill.customerCompanyName}
                </p>
              )}

              {bill.customerCompanyGSTIN && (
                <p>
                  <b>GSTIN:</b> {bill.customerCompanyGSTIN}
                </p>
              )}

              {/* ITEMS */}
              <div className="border rounded p-3 space-y-1">
                {bill.orders?.flatMap((o: any) =>
                  o.items.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>₹{it.totalPrice}</span>
                    </div>
                  )),
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
                        ₹
                        {bill.payments.reduce(
                          (sum: number, p: any) => sum + Number(p.amount || 0),
                          0,
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
                <p>
                  <b>Name:</b> {full.guestName}
                </p>
                <p>
                  <b>Phone:</b> {full.guestPhone}
                </p>
              </div>
              {full.guestIds?.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold mb-1">Guest ID Details</p>

                  <div className="space-y-1 text-sm">
                    {full.guestIds.map((id: any, i: number) => (
                      <div key={i}>
                        <span className="font-medium">{id.type}</span>
                        <span> : </span>
                        <span>{id.idNumber}</span>

                        {id.nameOnId && (
                          <>
                            <span className="mx-1"></span>
                            <span className="font-medium">Name on ID</span>
                            <span> : </span>
                            <span>{id.nameOnId}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAY INFO */}
              <div>
                <p className="font-semibold mb-1">Stay Details</p>
                <p>
                  <b>Room:</b> {full.room_id?.number || full.roomNumber} (
                  {full.room_id?.type || full.roomType})
                </p>
                <p>
                  <b>Check-in:</b> {formatLocal(full.checkIn)}
                </p>
                <p>
                  <b>Check-out:</b> {formatLocal(full.actualCheckoutTime)}
                </p>
                <p>
                  <b>Nights:</b> {full.stayNights}
                </p>
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

              {/* EXTRA SERVICES */}
              {full.extraServices?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Extra Services</p>

                  {full.extraServices.map((s: any, i: number) => {
                    const daysCount = Array.isArray(s.days) ? s.days.length : 1;
                    const amount = s.price * daysCount;

                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm"
                      >
                        <div className="flex flex-col">
                          <span>
                            {s.name} × {daysCount}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {s.gstEnabled ? (
                              <span className="text-green-600 font-medium">
                                GST Included
                              </span>
                            ) : (
                              <span className="text-gray-500 font-medium">
                                GST Exempt
                              </span>
                            )}
                          </span>
                        </div>

                        <span>₹{amount}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* FOOD CHARGES */}
              <div>
                <p className="font-semibold mb-1">Food Charges</p>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{full.foodSubtotalRaw}</span>
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
                    <span>{full.discountPercent}% (Room + Services)</span>
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
                  <span>
                    {full.advancePaymentMode ||
                      bookingInfo?.advancePaymentMode ||
                      "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Balance Due</span>
                  <span>₹{full.balanceDue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Payment Mode</span>
                  <span>{full.finalPaymentMode || "N/A"}</span>
                </div>
              </div>

              {/* FINAL TOTAL */}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Room + Services (after discount)</span>
                  <span>₹{full.roomNet}</span>
                </div>

                <div className="flex justify-between">
                  <span>Food Total</span>
                  <span>₹{full.foodTotal}</span>
                </div>

                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Grand Total</span>
                  <span>₹{full.totalAmount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ROOM INVOICE MODAL */}
      {isRoom && transformedBooking && hotel && billingData && (
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Invoice Type</DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  openPrintWindow(buildRoomInvoice_old(mappedInvoice));

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
                    buildFoodInvoice(
                      transformedBooking,
                      hotel,
                      billingData,
                      full.foodOrders,
                      full.finalPaymentReceived || false,
                      full.finalPaymentMode ||
                        transformedBooking.advancePaymentMode,
                    ),
                  );
                  setInvoiceModal(false);
                }}
              >
                Food Invoice Only
              </Button>

              <Button
                className="w-full"
                onClick={() => {
                  openPrintWindow(buildCombinedInvoice_old(mappedInvoice));

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
