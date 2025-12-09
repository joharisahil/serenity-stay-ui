// src/pages/BookingDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  getBookingByRoomApi,
  checkoutBookingApi,
  cancelBookingApi,
  changeRoomApi,
  extendStayApi,
} from "@/api/bookingApi";
import { getRoomServiceBillApi } from "@/api/billingRestaurantApi";
import { getHotelApi } from "@/api/hotelApi"; // <-- ensure this exists in your frontend API layer
import { Input } from "@/components/ui/input";

// --------- Helpers ----------
const PLAN_NAMES: Record<string, string> = {
  EP: "European Plan",
  CP: "Continental Plan",
  AP: "American Plan",
  MAP: "Modified American Plan",
};

function readablePlan(planCode?: string) {
  if (!planCode) return "N/A";
  const raw = String(planCode).split("_")[0];
  return PLAN_NAMES[raw] || raw;
}

const fmt = (n?: number) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

// open print window (hotel header left, invoice meta right)
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
    } catch (e) {
      console.warn("Print failed", e);
    }
  }, 300);
};

// --------- Component ----------
export default function BookingDetails() {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  const [booking, setBooking] = useState<any | null>(null);
  const [roomOrders, setRoomOrders] = useState<any[]>([]);
  const [roomOrderSummary, setRoomOrderSummary] = useState<any | null>(null);
  const [hotel, setHotel] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeRoom, setShowChangeRoom] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");
  const [showExtendStay, setShowExtendStay] = useState(false);
  const [newCheckOut, setNewCheckOut] = useState("");

  // Load booking, orders and hotel info
  useEffect(() => {
    if (!roomId) return;

    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getBookingByRoomApi(roomId);
        if (!mounted) return;
        const b = res.booking || null;
        setBooking(b);

        // hotel info (if booking present)
        if (b?.hotel_id) {
          try {
            const hotelRes = await getHotelApi(b.hotel_id);
            if (!mounted) return;
            if (hotelRes?.success) setHotel(hotelRes.hotel);
            else setHotel(null);
          } catch (e) {
            setHotel(null);
          }
        } else {
          setHotel(null);
        }

        // load food orders summary for this room
        const foodRes = await getRoomServiceBillApi(roomId);
        if (!mounted) return;
        if (foodRes?.success) {
          setRoomOrders(foodRes.orders || []);
          setRoomOrderSummary(foodRes.summary || null);
        } else {
          setRoomOrders([]);
          setRoomOrderSummary(null);
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load booking details");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [roomId]);

  if (loading) return <Layout><p className="p-6">Loading...</p></Layout>;

  if (!booking)
    return (
      <Layout>
        <div className="text-center py-20">
          <h1 className="text-xl font-bold">No active booking for this room</h1>
          <Button className="mt-4" onClick={() => navigate("/rooms")}>
            Back to Rooms
          </Button>
        </div>
      </Layout>
    );

  // -------------- Billing calculations (correct GST logic) --------------
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  // roomPrice pulled from booking.room_id & booking.planCode
  let roomPrice = 0;
  if (booking.room_id?.plans && booking.planCode) {
    const [planCode, type] = String(booking.planCode).split("_");
    const plan = booking.room_id.plans.find((p: any) => p.code === planCode);
    if (plan) roomPrice = type === "SINGLE" ? plan.singlePrice : plan.doublePrice;
  } else if (typeof booking.baseRate === "number") {
    roomPrice = booking.baseRate;
  }

  const roomStayTotal = roomPrice * nights;
  const serviceExtraTotal =
    (booking.addedServices || []).reduce((s: number, e: any) => s + (e.price || 0), 0) || 0;

  // Food summary (already contains GST)
  const foodSubtotal = roomOrderSummary?.subtotal || 0;
  const foodGST = roomOrderSummary?.gst || 0;
  const foodTotal = roomOrderSummary?.total || 0; // subtotal + gst

  // GST RATE for room (18%)
  const GST_RATE = 0.18;

  // Room base (stay + extras) → GST applies only here
  const roomBase = roomStayTotal + serviceExtraTotal;
  const roomGST = +(roomBase * GST_RATE).toFixed(2);

  // Discount and totals
  const discount = booking.discount || 0;
  const total = +(roomBase + roomGST + foodTotal - discount).toFixed(2);
  const balance = +(total - (booking.advancePaid || 0)).toFixed(2);

  // ------------------ Print HTML builders (Layout A) ------------------
  // Layout A: hotel info left, invoice meta (number/date/guest) right
  const buildHeaderHtml = (invoiceTitle: string, invoiceNumber: string, createdAt: string, guestName: string, guestPhone: string, roomNumber: string) => {
    const hotelLeft = hotel ? `
      <div style="text-align:left;">
        <div style="font-weight:700; font-size:18px;">${hotel.name}</div>
        <div style="font-size:12px; margin-top:6px;">${hotel.address || ""}</div>
        <div style="font-size:12px; margin-top:4px;">Phone: ${hotel.phone || ""}</div>
        ${hotel.email ? `<div style="font-size:12px;">Email: ${hotel.email}</div>` : ""}
        ${hotel.gstNumber ? `<div style="font-size:12px;">GSTIN: ${hotel.gstNumber}</div>` : ""}
      </div>
    ` : `<div style="text-align:left;"><strong>Your Hotel</strong></div>`;

    const metaRight = `
      <div style="text-align:right;">
        <div style="font-weight:700; font-size:16px;">${invoiceTitle}</div>
        <div style="font-size:13px; margin-top:6px;">Invoice: <strong>${invoiceNumber}</strong></div>
        <div style="font-size:12px; margin-top:4px;">Date: ${createdAt}</div>
        <div style="font-size:12px; margin-top:8px;">Guest: ${guestName}</div>
        <div style="font-size:12px;">Phone: ${guestPhone}</div>
        <div style="font-size:12px;">Room: ${roomNumber}</div>
      </div>
    `;

    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="width:50%;">${hotelLeft}</div>
        <div style="width:45%;">${metaRight}</div>
      </div>
      <hr style="margin:12px 0; border:none; border-top:1px solid #ccc;" />
    `;
  };

  const buildRoomHtml = () => {
    const invoiceNumber = `ROOM-${booking._id?.toString().slice(-6) || Date.now()}`;
    const createdAt = new Date().toLocaleString();
    return `
    <html>
      <head><title>Room Invoice</title>
      <style>
        body{font-family: Arial, sans-serif; padding:20px; color:#111}
        .row{display:flex; justify-content:space-between; margin:6px 0}
        .table{width:100%; border-collapse:collapse; margin-top:8px}
        .table th, .table td { border:1px solid #ddd; padding:8px; font-size:13px; }
        .right { text-align:right; }
      </style>
      </head>
      <body>
        ${buildHeaderHtml("Room Invoice", invoiceNumber, createdAt, booking.guestName || "N/A", booking.guestPhone || "N/A", booking.room_id?.number || "N/A")}

        <div style="margin-top:8px;">
          <div class="row"><div><strong>Plan</strong></div><div class="right">${readablePlan(booking.planCode)}</div></div>
          <div class="row"><div>Room Rate × Nights</div><div class="right">₹${fmt(roomPrice)} × ${nights} = ₹${fmt(roomStayTotal)}</div></div>
          ${booking.addedServices?.map((s:any) => `<div class="row"><div>${s.name}</div><div class="right">₹${fmt(s.price)}</div></div>`).join("") || ""}
          <div style="margin-top:10px;"></div>
          <div class="row"><div><strong>Room Subtotal</strong></div><div class="right"><strong>₹${fmt(roomBase)}</strong></div></div>
          <div class="row"><div>Room GST (18%)</div><div class="right">₹${fmt(roomGST)}</div></div>
          <hr style="margin:10px 0; border:none; border-top:1px dashed #ccc;" />
          <div class="row"><div><strong>Room Total</strong></div><div class="right"><strong>₹${fmt(roomBase + roomGST)}</strong></div></div>
        </div>

        <div style="height:28px;"></div>
        <div style="display:flex; justify-content:space-between; margin-top:28px;">
          <div style="width:60%; text-align:left;">
            <div style="margin-top:20px;">Authorised Signature</div>
            <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
          </div>
          <div style="width:35%; text-align:right;">
            <div>Advance Paid: ₹${fmt(booking.advancePaid)}</div>
            <div style="margin-top:8px; font-weight:700;">Balance: ₹${fmt((roomBase + roomGST) - (booking.advancePaid || 0))}</div>
          </div>
        </div>
      </body>
    </html>
  `;
  };

  const buildFoodHtml = () => {
    const invoiceNumber = `FOOD-${booking._id?.toString().slice(-6) || Date.now()}`;
    const createdAt = new Date().toLocaleString();
    return `
    <html>
      <head>
        <title>Food Invoice</title>
        <style>
          body{font-family: Arial, sans-serif; padding:20px; color:#111}
          .table{width:100%; border-collapse:collapse; margin-top:8px}
          .table th, .table td { border:1px solid #ddd; padding:8px; font-size:13px; }
        </style>
      </head>
      <body>
        ${buildHeaderHtml("Room Service Invoice", invoiceNumber, createdAt, booking.guestName || "N/A", booking.guestPhone || "N/A", booking.room_id?.number || "N/A")}
        <table class="table">
          <thead>
            <tr><th>Order</th><th>Items</th><th class="right">Amount (₹)</th></tr>
          </thead>
          <tbody>
            ${roomOrders.map((o:any) => `<tr>
              <td>Order #${String(o._id).slice(-6)}<br/><small>${new Date(o.createdAt).toLocaleString()}</small></td>
              <td>${o.items.map((it:any)=>`${it.name} × ${it.qty}`).join("<br/>")}</td>
              <td class="right">${fmt(o.total)}</td>
            </tr>`).join("")}
          </tbody>
        </table>

        <div style="margin-top:12px; text-align:right;">
          <div>Food Subtotal: ₹${fmt(foodSubtotal)}</div>
          <div>Food GST (included): ₹${fmt(foodGST)}</div>
          <div style="font-weight:700; margin-top:8px;">Total: ₹${fmt(foodTotal)}</div>
        </div>

        <div style="height:24px;"></div>
        <div style="text-align:left; margin-top:24px;">
          <div>Authorised Signature</div>
          <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
        </div>
      </body>
    </html>
    `;
  };

  const buildCombinedHtml = () => {
    const invoiceNumber = `FINAL-${booking._id?.toString().slice(-6) || Date.now()}`;
    const createdAt = new Date().toLocaleString();
    return `
    <html>
      <head>
        <title>Combined Invoice</title>
        <style>
          body{font-family: Arial, sans-serif; padding:20px; color:#111}
          .row{display:flex; justify-content:space-between; margin:6px 0}
          .table{width:100%; border-collapse:collapse; margin-top:8px}
          .table th, .table td { border:1px solid #ddd; padding:8px; font-size:13px; }
        </style>
      </head>
      <body>
        ${buildHeaderHtml("Final Invoice (Stay + Food)", invoiceNumber, createdAt, booking.guestName || "N/A", booking.guestPhone || "N/A", booking.room_id?.number || "N/A")}
        <h3>Stay</h3>
        <div class="row"><div>Room (${nights} nights × ₹${fmt(roomPrice)})</div><div>₹${fmt(roomStayTotal)}</div></div>
        ${booking.addedServices?.map((s:any) => `<div class="row"><div>${s.name}</div><div>₹${fmt(s.price)}</div></div>`).join("") || ""}
        <div class="row"><div>Room Subtotal</div><div>₹${fmt(roomBase)}</div></div>
        <div class="row"><div>Room GST (18%)</div><div>₹${fmt(roomGST)}</div></div>

        <h3 style="margin-top:12px;">Food</h3>
        ${roomOrders.map((o:any) => `<div class="row"><div>Order #${String(o._id).slice(-6)}</div><div>₹${fmt(o.total)}</div></div>`).join("")}
        <div class="row"><div>Food Subtotal</div><div>₹${fmt(foodSubtotal)}</div></div>
        <div class="row"><div>Food GST (included)</div><div>₹${fmt(foodGST)}</div></div>

        <hr style="margin:12px 0; border:none; border-top:1px dashed #ccc;" />

        <div class="row"><div><strong>Discount</strong></div><div>₹${fmt(discount)}</div></div>
        <div class="row"><div style="font-size:16px; font-weight:700;">Grand Total</div><div style="font-size:16px; font-weight:700;">₹${fmt(total)}</div></div>
        <div class="row"><div>Advance Paid</div><div>₹${fmt(booking.advancePaid)}</div></div>
        <div class="row"><div style="font-weight:700;">Balance Due</div><div style="font-weight:700;">₹${fmt(balance)}</div></div>

        <div style="height:36px;"></div>
        <div style="display:flex; justify-content:space-between;">
          <div>
            <div>Authorised Signature</div>
            <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
          </div>
          <div style="text-align:right;">
            <div>Prepared By</div>
            <div style="margin-top:40px; border-top:1px solid #000; width:160px; margin-left:auto;"></div>
          </div>
        </div>
      </body>
    </html>
    `;
  };

  // ------------------ Handlers ------------------
  const handleCheckout = async () => {
    if (!booking?._id) return;
    setCheckingOut(true);
    try {
      await checkoutBookingApi(booking._id);
      toast.success("Guest checked out successfully");
      navigate("/rooms");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

const handleCancelBooking = async () => {
  try {
    await cancelBookingApi(booking._id);
    toast.success("Booking cancelled");
    navigate("/rooms");
  } catch (e:any) {
    toast.error(e?.response?.data?.message || "Failed to cancel");
  }
};

  // ------------------ UI ------------------
  return (
    <Layout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">Booking Details</h1>
              <p className="text-muted-foreground">
                Room {booking.room_id?.number} — {booking.room_id?.type}
              </p>
            </div>
          </div>

          <Badge className="bg-room-occupied text-white">Occupied</Badge>
        </div>

        {/* GUEST & STAY INFO */}
        <Card>
          <CardHeader><CardTitle>Guest Information</CardTitle></CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {booking.guestName}</p>
            <p><strong>Phone:</strong> {booking.guestPhone}</p>
            <p><strong>Adults:</strong> {booking.adults}</p>
            <p><strong>Children:</strong> {booking.children}</p>
            <p><strong>Plan:</strong> {readablePlan(booking.planCode)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stay Details</CardTitle></CardHeader>
          <CardContent>
            <p><strong>Check-in:</strong> {new Date(booking.checkIn).toDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(booking.checkOut).toDateString()}</p>
            <p><strong>Nights:</strong> {nights}</p>
          </CardContent>
        </Card>

        {/* BILLING SUMMARY */}
        <Card>
          <CardHeader><CardTitle>Billing Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Room ({nights} nights × ₹{fmt(roomPrice)})</span>
                <span>₹{fmt(roomStayTotal)}</span>
              </div>

              {(booking.addedServices || []).map((s: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{s.name}</span>
                  <span>₹{fmt(s.price)}</span>
                </div>
              ))}

              {roomOrders.length > 0 && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="text-primary font-semibold mb-2">Room Service Orders</h3>
                  </div>

                  {roomOrders.map((order: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3 bg-secondary/20 space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Order #{String(order._id).slice(-6)}</span>
                        <span>₹{fmt(order.total)}</span>
                      </div>

                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Ordered At:</span>
                        <span>{new Date(order.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="pt-1 space-y-1">
                        {order.items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{item.name} ({item.qty} × ₹{fmt(item.unitPrice)})</span>
                            <span>₹{fmt(item.totalPrice)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between text-sm text-muted-foreground border-t pt-1">
                        <span>GST (included)</span>
                        <span>₹{fmt(order.gst)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Food Subtotal</span>
                      <span>₹{fmt(foodSubtotal)}</span>
                    </div>

                    <div className="flex justify-between font-medium">
                      <span>Food GST (included)</span>
                      <span>₹{fmt(foodGST)}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span>Food Total</span>
                      <span>₹{fmt(foodTotal)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* MAIN TOTALS */}
              <div className="flex justify-between border-t pt-4">
                <span className="font-medium">Room + Extras (before GST)</span>
                <span>₹{fmt(roomBase)}</span>
              </div>

              <div className="flex justify-between">
                <span>Room GST (18%)</span>
                <span>₹{fmt(roomGST)}</span>
              </div>

              <div className="flex justify-between">
                <span>Discount</span>
                <span>- ₹{fmt(discount)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{fmt(total)}</span>
              </div>

              <div className="flex justify-between text-success">
                <span>Advance Paid</span>
                <span>₹{fmt(booking.advancePaid)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Balance Due</span>
                <span className="text-warning">₹{fmt(balance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-4">
          <Button disabled={checkingOut} onClick={() => setConfirmCheckout(true)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {checkingOut ? "Processing..." : "Mark Check-out"}
          </Button>
          <Button variant="destructive" onClick={() => setShowCancelModal(true)}>Cancel Booking</Button>
          <Button variant="outline" onClick={() => setShowChangeRoom(true)}><Edit className="mr-2 h-4 w-4" /> Change Room</Button>
          <Button variant="outline" onClick={() => setShowExtendStay(true)}><Edit className="mr-2 h-4 w-4" /> Extend Stay</Button>
          <Button variant="outline" onClick={() => setInvoiceModal(true)}>
            <Download className="mr-2 h-4 w-4" /> Download Invoice
          </Button>
        </div>

        {/* INVOICE DIALOG */}
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Select Invoice Type</DialogTitle></DialogHeader>

            <div className="space-y-3 py-3">
              <Button className="w-full" onClick={() => openPrintWindow(buildRoomHtml())}>
                Room Invoice Only
              </Button>

              <Button className="w-full" onClick={() => openPrintWindow(buildFoodHtml())} disabled={roomOrders.length === 0}>
                Food Invoice Only
              </Button>

              <Button className="w-full" onClick={() => openPrintWindow(buildCombinedHtml())}>
                Full Invoice (Room + Food)
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* CONFIRM CHECKOUT */}
        <Dialog open={confirmCheckout} onOpenChange={setConfirmCheckout}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Checkout</DialogTitle></DialogHeader>

            <p>Are you sure you want to mark this room as checked out? This will finalize the invoice and release the room.</p>

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setConfirmCheckout(false)}>Cancel</Button>
              <Button onClick={() => { setConfirmCheckout(false); handleCheckout(); }} disabled={checkingOut}>
                {checkingOut ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Cancel Booking</DialogTitle>
    </DialogHeader>

    <p>Are you sure you want to cancel this booking? This will release the room immediately.</p>

    <DialogFooter className="mt-4 flex justify-end gap-4">
      <Button variant="outline" onClick={() => setShowCancelModal(false)}>Close</Button>

      <Button
        variant="destructive"
        onClick={() => {
          setShowCancelModal(false);
          handleCancelBooking();
        }}
      >
        Confirm Cancel
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
<Dialog open={showChangeRoom} onOpenChange={setShowChangeRoom}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Change Room</DialogTitle>
    </DialogHeader>

    <p>Select new room ID:</p>
    <Input
      placeholder="Enter room ID"
      value={newRoomId}
      onChange={(e) => setNewRoomId(e.target.value)}
      className="mt-2"
    />

    <DialogFooter className="mt-4">
      <Button variant="outline" onClick={() => setShowChangeRoom(false)}>Cancel</Button>
      <Button
        onClick={async () => {
          try {
            await changeRoomApi(booking._id, newRoomId);
            toast.success("Room changed successfully");
            navigate("/rooms");
          } catch {
            toast.error("Failed to change room");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
<Dialog open={showExtendStay} onOpenChange={setShowExtendStay}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Extend Stay</DialogTitle>
    </DialogHeader>

    <p>New Checkout Date:</p>
    <Input
      type="date"
      value={newCheckOut}
      onChange={(e) => setNewCheckOut(e.target.value)}
      className="mt-2"
    />

    <DialogFooter className="mt-4">
      <Button variant="outline" onClick={() => setShowExtendStay(false)}>Cancel</Button>
      <Button
        onClick={async () => {
          try {
            await extendStayApi(booking._id, newCheckOut);
            toast.success("Stay extended");
            navigate("/rooms");
          } catch {
            toast.error("Failed to extend stay");
          }
        }}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </Layout>
  );
}
