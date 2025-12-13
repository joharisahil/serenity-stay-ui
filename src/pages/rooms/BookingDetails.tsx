// src/pages/BookingDetails.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, CheckCircle, Loader2 } from "lucide-react";
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
  getAvailableRoomsApi,
  getBookingApi,
  getTodayBookingByRoomApi,
  getRoomServiceBillForBookingApi,
} from "@/api/bookingApi";
import { getRoomServiceBillApi } from "@/api/billingRestaurantApi";
import { getHotelApi } from "@/api/hotelApi";
import { Input } from "@/components/ui/input";
import { getAvailableRoomsByDateApi } from "@/api/roomApi";

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

// Print popup window
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
    } catch (e) { }
  }, 300);
};

export default function BookingDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const passedBookingId = location.state?.bookingId || null;


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
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);

  const [showExtendStay, setShowExtendStay] = useState(false);
  const [newCheckOut, setNewCheckOut] = useState("");

  // ---------------------------------------------
  // Load booking + orders + hotel + available rooms
  // ---------------------------------------------
  //   const location = useLocation();
  // const passedBookingId = location.state?.bookingId || null;
  const selectedCheckIn = location.state?.selectedCheckIn || null;
  const selectedCheckOut = location.state?.selectedCheckOut || null;

  useEffect(() => {
    if (!roomId) return;

    let mounted = true;

    const load = async () => {
      setLoading(true);

      try {
        let booking;

        /* ----------------------------------------
         * 1️⃣ FETCH BOOKING (DATE MODE / TODAY MODE)
         * ---------------------------------------- */
        if (passedBookingId) {
          // DATE RANGE MODE
          booking = await getBookingApi(passedBookingId);
        } else {
          // TODAY MODE
          const res = await getTodayBookingByRoomApi(roomId);

          booking = res.booking || null;

        }

        if (!mounted) return;
        setBooking(booking);

        /* ----------------------------------------
         * 2️⃣ FETCH HOTEL
         * ---------------------------------------- */
        if (booking?.hotel_id) {
          try {
            const hotelRes = await getHotelApi(booking.hotel_id);
            if (!mounted) return;

            if (hotelRes?.success) setHotel(hotelRes.hotel);
            else setHotel(null);
          } catch (e) {
            setHotel(null);
          }
        } else {
          setHotel(null);
        }

        /* ----------------------------------------
         * 3️⃣ FETCH ROOM SERVICE / FOOD ORDERS
         * ---------------------------------------- */
        try {
          const foodRes = await getRoomServiceBillForBookingApi(booking._id);
          if (!mounted) return;

          if (foodRes.success) {
            setRoomOrders(foodRes.orders || []);
            setRoomOrderSummary(foodRes.summary || null);
          } else {
            setRoomOrders([]);
            setRoomOrderSummary(null);
          }
        } catch (e) {
          setRoomOrders([]);
          setRoomOrderSummary(null);
        }

        /* ----------------------------------------
         * 4️⃣ FETCH AVAILABLE ROOMS OF SAME TYPE
         * ---------------------------------------- */
        if (booking?.room_id?.type) {
          try {
            const type = booking.room_id.type;

            let availableSameType = [];

            if (passedBookingId && selectedCheckIn && selectedCheckOut) {
              // 🔹 DATE-RANGE MODE
              availableSameType = await getAvailableRoomsByDateApi(
                selectedCheckIn,
                selectedCheckOut,
                type
              );
            } else {
              // 🔹 TODAY MODE — USE SIMPLE API
              const simple = await getAvailableRoomsApi(type);
              availableSameType = simple || [];
            }

            if (!mounted) return;
            setAvailableRooms(availableSameType);

          } catch (e) {
            if (mounted) setAvailableRooms([]);
          }
        }


      } catch (e) {
        toast.error("Failed to load booking details");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [roomId, passedBookingId, selectedCheckIn, selectedCheckOut]);


  if (loading)
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );


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

  // ---------------- Billing Logic -----------------
  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );

  let roomPrice = 0;
  if (booking.room_id?.plans && booking.planCode) {
    const [planCode, type] = String(booking.planCode).split("_");
    const plan = booking.room_id.plans.find((p: any) => p.code === planCode);
    if (plan) roomPrice = type === "SINGLE" ? plan.singlePrice : plan.doublePrice;
  } else roomPrice = booking.baseRate || 0;

  const roomStayTotal = roomPrice * nights;
  const serviceExtraTotal =
    (booking.addedServices || []).reduce((a: number, b: any) => a + (b.price || 0), 0) || 0;

  const roomBase = roomStayTotal + serviceExtraTotal;
  const CGST = +(roomBase * 0.025).toFixed(2);
  const SGST = +(roomBase * 0.025).toFixed(2);
  const GST = CGST + SGST; // total 5%

  const foodSubtotal = roomOrderSummary?.subtotal || 0;
  const foodGST = roomOrderSummary?.gst || 0;
  const foodTotal = roomOrderSummary?.total || 0;

  // ---------------- Billing Logic -----------------
  // ---------------- Correct Billing Logic -----------------

  // discount only applies on ROOM charges
  const discountPercent = Number(booking.discount || 0);

  // ROOM GROSS (Room + GST)
  const roomGross = roomBase + GST;

  // room-only discount
  const roomDiscountAmount = +((roomGross * discountPercent) / 100).toFixed(2);

  // net room total after discount
  const roomNet = roomGross - roomDiscountAmount;

  // food total stays untouched
  const foodNet = foodTotal;

  // final combined total
  const total = roomNet + foodNet;

  // balance logic stays same
  const balance = total - (booking.advancePaid || 0);



  const buildHeaderHtml = (
    invoiceTitle: string,
    invoiceNumber: string,
    createdAt: string,
    guestName: string,
    guestPhone: string,
    roomNumber: string
  ) => {
    return `
    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
      <div style="width:50%; text-align:left;">
        <div style="font-weight:700; font-size:18px;">${hotel?.name || ""}</div>
        <div style="font-size:12px; margin-top:6px;">${hotel?.address || ""}</div>
        <div style="font-size:12px; margin-top:4px;">Phone: ${hotel?.phone || ""}</div>
        ${hotel?.email ? `<div style="font-size:12px;">Email: ${hotel.email}</div>` : ""}
        ${hotel?.gstNumber ? `<div style="font-size:12px;">GSTIN: ${hotel.gstNumber}</div>` : ""}
      </div>

      <div style="width:45%; text-align:right;">
        <div style="font-weight:700; font-size:16px;">${invoiceTitle}</div>
        <div style="font-size:13px; margin-top:6px;">Invoice: <strong>${invoiceNumber}</strong></div>
        <div style="font-size:12px; margin-top:4px;">Date: ${createdAt}</div>
        <div style="font-size:12px; margin-top:8px;">Guest: ${guestName}</div>
        <div style="font-size:12px;">Phone: ${guestPhone}</div>
        <div style="font-size:12px;">Room: ${roomNumber}</div>
      </div>
    </div>

    <hr style="margin:12px 0; border:none; border-top:1px solid #ccc;" />
  `;
  };


  // ⭐ FIX — ROOM ONLY INVOICE CALCULATION
  const buildRoomHtml = () => {
    const invoiceNumber = `ROOM-${booking._id?.toString().slice(-6)}`;
    const createdAt = new Date().toLocaleString();

    const roomGross = roomBase + GST;
    const roomDiscountAmount = +(
      (roomGross * discountPercent) /
      100
    ).toFixed(2);

    const roomNet = roomGross - roomDiscountAmount;
    const roomBalance = roomNet - (booking.advancePaid || 0);

    return `
  <html>
    <head>
      <title>Room Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .row { display:flex; justify-content:space-between; margin:6px 0; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml(
      "Room Invoice",
      invoiceNumber,
      createdAt,
      booking.guestName,
      booking.guestPhone,
      booking.room_id.number
    )}

      <div class="row"><div><strong>Plan</strong></div><div>${readablePlan(
      booking.planCode
    )}</div></div>

      <div class="row">
        <div>Room Rate × Nights</div>
        <div>₹${fmt(roomPrice)} × ${nights} = ₹${fmt(roomStayTotal)}</div>
      </div>

      ${(booking.addedServices || [])
        .map(
          (s) =>
            `<div class="row"><div>${s.name}</div><div>₹${fmt(
              s.price
            )}</div></div>`
        )
        .join("")}

      <hr/>

      <div class="row"><strong>Room Subtotal</strong><strong>₹${fmt(
          roomBase
        )}</strong></div>
      <div class="row"><div>CGST (2.5%)</div><div>₹${fmt(CGST)}</div></div>
      <div class="row"><div>SGST (2.5%)</div><div>₹${fmt(SGST)}</div></div>

      <div class="row"><strong>Discount (${discountPercent}%)</strong><strong>₹${fmt(
          roomDiscountAmount
        )}</strong></div>

      <div class="row"><strong>Room Total</strong><strong>₹${fmt(
          roomNet
        )}</strong></div>

      <div style="margin-top:40px;">
        <div>Advance Paid: ₹${fmt(booking.advancePaid)}</div>
        <div style="margin-top:8px; font-weight:700;">Balance: ₹${fmt(
          roomBalance
        )}</div>
      </div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
  };

  const buildFoodHtml = () => {
    const invoiceNumber = `FOOD-${booking._id?.toString().slice(-6)}`;
    const createdAt = new Date().toLocaleString();

    return `
  <html>
    <head>
      <title>Food Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .table { width:100%; border-collapse:collapse; margin-top:8px; }
        .table th, .table td { border:1px solid #ddd; padding:8px; font-size:13px; }
        .right { text-align:right; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml("Food Invoice", invoiceNumber, createdAt, booking.guestName, booking.guestPhone, booking.room_id.number)}

      <table class="table">
        <thead>
          <tr><th>Order</th><th>Items</th><th class="right">Amount</th></tr>
        </thead>
        <tbody>
          ${roomOrders
        .map(o => `
              <tr>
                <td>
                  Order #${String(o._id).slice(-6)}
                  <br/><small>${new Date(o.createdAt).toLocaleString()}</small>
                </td>

                <td>
                  ${o.items.map(i => `${i.name} × ${i.qty}`).join("<br/>")}
                </td>

                <td class="right">₹${fmt(o.total)}</td>
              </tr>
            `)
        .join("")}
        </tbody>
      </table>

      <div style="margin-top:12px; text-align:right;">
        <div>Food Subtotal: ₹${fmt(foodSubtotal)}</div>
        <div>Food GST (included): ₹${fmt(foodGST)}</div>
        <div style="font-weight:700; margin-top:8px;">Total: ₹${fmt(foodTotal)}</div>
      </div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
  };

  const buildCombinedHtml = () => {
    const invoiceNumber = `FINAL-${booking._id?.toString().slice(-6)}`;
    const createdAt = new Date().toLocaleString();

    return `
  <html>
    <head>
      <title>Combined Invoice</title>
      <style>
        body { font-family: Arial; padding:20px; }
        .row { display:flex; justify-content:space-between; margin:6px 0; }
        .items { font-size:12px; margin-left:12px; color:#444; }
      </style>
    </head>

    <body>
      ${buildHeaderHtml(
      "Final Invoice",
      invoiceNumber,
      createdAt,
      booking.guestName,
      booking.guestPhone,
      booking.room_id.number
    )}

      <h3>Stay Charges</h3>
      <div class="row"><div>Room (${nights} nights × ₹${fmt(roomPrice)})</div><div>₹${fmt(roomStayTotal)}</div></div>

      ${(booking.addedServices || [])
        .map(
          (s) =>
            `<div class="row"><div>${s.name}</div><div>₹${fmt(s.price)}</div></div>`
        )
        .join("")}

      <div class="row"><div>Room Subtotal</div><div>₹${fmt(roomBase)}</div></div>
      <div class="row"><div>CGST (2.5%)</div><div>₹${fmt(CGST)}</div></div>
      <div class="row"><div>SGST (2.5%)</div><div>₹${fmt(SGST)}</div></div>

      <h3 style="margin-top:12px;">Food</h3>

      ${roomOrders
        .map(
          (o) => `
          <div class="row">
            <div>
              Order #${String(o._id).slice(-6)}
              <br/>
              <span style="font-size:11px; color:#777;">
                ${new Date(o.createdAt).toLocaleString()}
              </span>
              <div class="items">
                ${o.items
              .map(
                (it) =>
                  `${it.name} × ${it.qty} (₹${fmt(it.totalPrice)})`
              )
              .join("<br/>")}
              </div>
            </div>

            <div>₹${fmt(o.total)}</div>
          </div>
        `
        )
        .join("")}

      <div class="row"><div>Food Subtotal</div><div>₹${fmt(foodSubtotal)}</div></div>
      <div class="row"><div>Food GST (included)</div><div>₹${fmt(foodGST)}</div></div>

      <hr/>
      <div class="row">
  <div><strong>Room Discount (${discountPercent}%)</strong></div>
  <div><strong>₹${fmt(roomDiscountAmount)}</strong></div>
</div>

<div class="row"><strong>Grand Total</strong><strong>₹${fmt(total)}</strong></div>

      <div class="row"><div>Advance Paid</div><div>₹${fmt(booking.advancePaid)}</div></div>
      <div class="row" style="font-weight:700;"><div>Balance Due</div><div>₹${fmt(balance)}</div></div>

      <div style="margin-top:60px;">
        <div>Authorised Signature</div>
        <div style="margin-top:40px; border-top:1px solid #000; width:160px;"></div>
      </div>
    </body>
  </html>
  `;
  };



  // ---------------- Handlers -----------------
  const handleCheckout = async () => {
    if (!booking?._id) return;
    setCheckingOut(true);

    try {
      await checkoutBookingApi(booking._id);
      toast.success("Guest checked out successfully");
      navigate("/rooms");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      await cancelBookingApi(booking._id);
      toast.success("Booking cancelled");
      navigate("/rooms");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to cancel booking");
    }
  };

  const loadAvailableRooms = async () => {
    if (!booking?.room_id?.type) return;

    try {
      const rooms = await getAvailableRoomsApi(booking.room_id.type);

      // Remove current room from the list
      const filteredRooms = rooms.filter((r: any) => r._id !== booking.room_id._id);

      setAvailableRooms(filteredRooms);
    } catch {
      setAvailableRooms([]);
    }
  };


  // ============================================================
  // UI STARTS
  // ============================================================
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
                Room {booking.room_id.number} — {booking.room_id.type}
              </p>
            </div>
          </div>

          <Badge className="bg-room-occupied text-white">Occupied</Badge>
        </div>

        {/* Guest Info */}
        <Card>
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {booking.guestName}</p>
            <p><strong>Phone:</strong> {booking.guestPhone}</p>
            <p><strong>Plan:</strong> {readablePlan(booking.planCode)}</p>
          </CardContent>
        </Card>
        {/* Guest ID Proofs */}
        {booking.guestIds && booking.guestIds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Guest ID Proofs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {booking.guestIds.map((id: any, idx: number) => (
                <div
                  key={idx}
                  className="border p-3 rounded-md bg-secondary/30 space-y-1"
                >
                  <p><strong>ID Type:</strong> {id.type}</p>
                  <p><strong>ID Number:</strong> {id.idNumber}</p>
                  <p><strong>Name on ID:</strong> {id.nameOnId}</p>
                </div>
              ))}

            </CardContent>
          </Card>
        )}


        {/* Stay Info */}
        <Card>
          <CardHeader>
            <CardTitle>Stay Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Check-in:</strong> {new Date(booking.checkIn).toDateString()}</p>
            <p><strong>Check-out:</strong> {new Date(booking.checkOut).toDateString()}</p>
            <p><strong>Nights:</strong> {nights}</p>
          </CardContent>
        </Card>

        {/* Billing */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Room ({nights} nights × ₹{fmt(roomPrice)})</span>
                <span>₹{fmt(roomStayTotal)}</span>
              </div>

              {(booking.addedServices || []).map((s: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span>{s.name}</span>
                  <span>₹{fmt(s.price)}</span>
                </div>
              ))}

              {/* Food */}
              {roomOrders.map((order: any, idx: number) => (
                <div key={idx} className="p-3 border rounded bg-secondary/20 space-y-2">

                  {/* Order header */}
                  <div className="flex justify-between font-medium">
                    <span>Order #{String(order._id).slice(-6)}</span>
                    <span>₹{fmt(order.total)}</span>
                  </div>

                  {/* Timestamp */}
                  <div className="text-xs text-muted-foreground flex justify-between">
                    <span>Ordered At:</span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Items */}
                  <div className="pt-1 space-y-1">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {item.name} ({item.qty} × ₹{fmt(item.unitPrice)})
                        </span>
                        <span>₹{fmt(item.totalPrice)}</span>
                      </div>
                    ))}
                  </div>

                  {/* GST */}
                  <div className="flex justify-between text-sm text-muted-foreground border-t pt-1">
                    <span>GST</span>
                    <span>₹{fmt(order.gst)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Food Total</span>
                    <span>₹{fmt(order.total)}</span>
                  </div>
                </div>
              ))}


              <hr />

              <div className="flex justify-between">
                <span>Room + Extras</span>
                <span>₹{fmt(roomBase)}</span>
              </div>

              <div className="flex justify-between">
                <span>CGST (2.5%)</span>
                <span>₹{fmt(CGST)}</span>
              </div>

              <div className="flex justify-between">
                <span>SGST (2.5%)</span>
                <span>₹{fmt(SGST)}</span>
              </div>

              <div className="flex justify-between font-medium">
                <span>Total GST (5%)</span>
                <span>₹{fmt(GST)}</span>
              </div>


              <div className="flex justify-between">
                <span>Discount</span>
                <span>-₹{fmt(discountPercent)}%</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2">
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

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-4">
          <Button disabled={checkingOut} onClick={() => setConfirmCheckout(true)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            {checkingOut ? "Processing..." : "Mark Check-out"}
          </Button>

          <Button variant="destructive" onClick={() => setShowCancelModal(true)}>
            Cancel Booking
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              loadAvailableRooms();   // ← Load rooms here
              setShowChangeRoom(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" /> Change Room
          </Button>


          <Button variant="outline" onClick={() => setShowExtendStay(true)}>
            <Edit className="mr-2 h-4 w-4" /> Extend Stay
          </Button>

          <Button variant="outline" onClick={() => setInvoiceModal(true)}>
            <Download className="mr-2 h-4 w-4" /> Download Invoice
          </Button>
        </div>

        {/* CHANGE ROOM DIALOG */}
        <Dialog
          open={showChangeRoom}
          onOpenChange={(open) => {
            setShowChangeRoom(open);
            if (open) loadAvailableRooms();
          }}
        >

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Room</DialogTitle>
              <p className="text-sm text-muted-foreground">
                Select an available room of the same category
              </p>
            </DialogHeader>

            <div className="mt-4">
              <label className="block text-sm mb-2">Available Rooms</label>

              <select
                className="w-full border rounded p-2"
                value={newRoomId}
                onChange={(e) => setNewRoomId(e.target.value)}
              >
                <option value="">-- Select Room --</option>

                {availableRooms.map((r: any) => (
                  <option key={r._id} value={r._id}>
                    Room {r.number} ({r.type})
                  </option>
                ))}
              </select>

              {availableRooms.length === 0 && (
                <p className="text-sm text-red-500 mt-2">
                  No rooms available in this category.
                </p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowChangeRoom(false)}>
                Cancel
              </Button>

              <Button
                disabled={!newRoomId}
                onClick={async () => {
                  try {
                    await changeRoomApi(booking._id, newRoomId);
                    toast.success("Room changed successfully");
                    navigate("/rooms");
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message || "Failed to change room");
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EXTEND STAY */}
        <Dialog open={showExtendStay} onOpenChange={setShowExtendStay}>
          <DialogContent>
            <DialogHeader><DialogTitle>Extend Stay</DialogTitle></DialogHeader>

            <p>New Checkout Date:</p>
            <Input
              type="date"
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
              className="mt-2"
            />

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowExtendStay(false)}>
                Cancel
              </Button>
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

        {/* CANCEL BOOKING */}
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Cancel Booking</DialogTitle></DialogHeader>

            <p>Are you sure you want to cancel this booking?</p>

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                Close
              </Button>

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
        {/* CONFIRM CHECKOUT DIALOG */}
        <Dialog open={confirmCheckout} onOpenChange={setConfirmCheckout}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Check-out</DialogTitle>
            </DialogHeader>

            <p>Are you sure you want to check out this guest?</p>

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button variant="outline" onClick={() => setConfirmCheckout(false)}>
                Cancel
              </Button>

              <Button
                disabled={checkingOut}
                onClick={() => {
                  setConfirmCheckout(false);
                  handleCheckout();
                }}
              >
                {checkingOut ? "Processing..." : "Confirm Check-out"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* INVOICE DIALOG */}
        <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Select Invoice Type
              </DialogTitle>
            </DialogHeader>
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
              <Button variant="outline" onClick={() => setInvoiceModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
