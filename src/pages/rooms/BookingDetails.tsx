// src/pages/BookingDetails.tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Edit,
  CheckCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import {
  buildRoomInvoice,
  buildFoodInvoice,
  buildCombinedInvoice,
} from "@/utils/printInvoice";
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
  updateFoodBillingApi,
  updateRoomBillingApi,
  updateGuestIdsApi,
  updateGuestInfoApi,
  updateCompanyDetailsApi,
  reduceStayApi,
  updateBookingServicesApi,
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

const calcExtraServiceAmount = (s: any, nights: number) => {
  const days =
    Array.isArray(s.days) && s.days.length > 0
      ? s.days
      : Array.from({ length: nights }, (_, i) => i + 1);

  const qty = days.length;
  const base = (s.price || 0) * qty;

  const gstEnabled = s.gstEnabled === undefined ? true : Boolean(s.gstEnabled);

  const gst = gstEnabled ? +(base * 0.05).toFixed(2) : 0;

  return {
    qty,
    base,
    gstEnabled,
    cgst: +(gst / 2).toFixed(2),
    sgst: +(gst / 2).toFixed(2),
    total: base + gst,
    days,
  };
};
const toUTCISOString = (localDateTime?: string) => {
  if (!localDateTime) return null;

  const [date, time] = localDateTime.split("T");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  return new Date(y, m - 1, d, hh, mm).toISOString();
};

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
    } catch (e) {}
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

  const [roomDiscountInput, setRoomDiscountInput] = useState("");
  const [foodDiscountInput, setFoodDiscountInput] = useState("");

  const [finalPaymentReceived, setFinalPaymentReceived] = useState(false);
  const [finalPaymentMode, setFinalPaymentMode] = useState("CASH");

  // EDIT MODALS
  const [editGuestOpen, setEditGuestOpen] = useState(false);
  const [editGuestIdsOpen, setEditGuestIdsOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [reduceStayOpen, setReduceStayOpen] = useState(false);

  // EDIT FORMS
  const [guestForm, setGuestForm] = useState<any>({});
  const [guestIdsForm, setGuestIdsForm] = useState<any[]>([]);
  const [companyForm, setCompanyForm] = useState<any>({});
  const [reduceCheckOut, setReduceCheckOut] = useState("");
  const [editServicesOpen, setEditServicesOpen] = useState(false);
  const [servicesForm, setServicesForm] = useState<any[]>([]);

  // ---------------------------------------------
  // Load booking + orders + hotel + available rooms
  // ---------------------------------------------
  //   const location = useLocation();
  // const passedBookingId = location.state?.bookingId || null;
  const selectedCheckIn = location.state?.selectedCheckIn || null;
  const selectedCheckOut = location.state?.selectedCheckOut || null;

  const formatLocal = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    });

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
        setRoomDiscountInput(String(booking.discount ?? ""));
        setFoodDiscountInput(String(booking.foodDiscount ?? ""));

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
                type,
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
        (1000 * 60 * 60 * 24),
    ),
  );

  // ---------- ROOM PRICE ----------
  let roomPrice = 0;
  if (booking.room_id?.plans && booking.planCode) {
    const [planCode, type] = String(booking.planCode).split("_");
    const plan = booking.room_id.plans.find((p: any) => p.code === planCode);
    if (plan)
      roomPrice = type === "SINGLE" ? plan.singlePrice : plan.doublePrice;
  } else {
    roomPrice = booking.baseRate || 0;
  }

  const roomStayTotal = roomPrice * nights;

  // ---------- ROOM BASE ----------
  let roomBase = roomStayTotal;

  // Split extras into GST + NON-GST
  let extrasGstBase = 0;
  let extrasNonGstBase = 0;

  (booking.addedServices || []).forEach((s: any) => {
    const c = calcExtraServiceAmount(s, nights);

    if (c.gstEnabled) {
      extrasGstBase += c.base;
    } else {
      extrasNonGstBase += c.base;
    }
  });

  roomBase += extrasGstBase + extrasNonGstBase;

  // ---------- DISCOUNT ----------
  const roomDiscountPercent = Number(booking.discount || 0);
  const roomDiscountAmount = +((roomBase * roomDiscountPercent) / 100).toFixed(
    2,
  );

  // ---------- TAXABLE (GST ENABLED ONLY) ----------
  const discountRatio = roomBase > 0 ? roomDiscountAmount / roomBase : 0;

  const taxable = booking.gstEnabled
    ? +((roomStayTotal + extrasGstBase) * (1 - discountRatio)).toFixed(2)
    : 0;

  // ---------- GST ----------
  const totalGST = booking.gstEnabled ? +(taxable * 0.05).toFixed(2) : 0;

  const roomCGST = +(totalGST / 2).toFixed(2);
  const roomSGST = +(totalGST / 2).toFixed(2);

  // ---------- ROOM TOTAL ----------
  const roomNet = roomBase - roomDiscountAmount + roomCGST + roomSGST;

  // ---------- FOOD BILLING (DISCOUNT ON FOOD SUBTOTAL ONLY) ----------
  const foodSubtotalRaw = roomOrderSummary?.subtotal || 0;
  const foodGSTRaw = roomOrderSummary?.gst || 0;

  // Discount applies BEFORE GST
  const foodDiscountPercent = Number(booking.foodDiscount || 0);
  const foodDiscountAmount = +(
    (foodSubtotalRaw * foodDiscountPercent) /
    100
  ).toFixed(2);

  // New discounted subtotal
  const foodSubtotalAfterDiscount = foodSubtotalRaw - foodDiscountAmount;

  // Recalculate GST (5%) after discount
  const foodGST = booking.foodGSTEnabled
    ? +(foodSubtotalAfterDiscount * 0.05).toFixed(2)
    : 0;

  // CGST = SGST = half
  const foodCGST = +(foodGST / 2).toFixed(2);
  const foodSGST = +(foodGST / 2).toFixed(2);

  // Final food total
  const foodTotal = foodSubtotalAfterDiscount + foodGST;

  // ---------- FINAL TOTAL ----------
  let grandTotal = roomNet + foodTotal;

  let roundOffAmount = booking.roundOffAmount || 0;

  if (booking.roundOffEnabled) {
    const rounded = Math.round(grandTotal);
    roundOffAmount = +(rounded - grandTotal).toFixed(2);
    grandTotal = rounded;
  }

  // BALANCE
  const balance = grandTotal - (booking.advancePaid || 0);

  const billingData = {
    nights,
    roomPrice,
    roomStayTotal,
    extrasBase: extrasGstBase + extrasNonGstBase,
    roomBase,
    roomCGST,
    roomSGST,
    roomDiscountAmount,
    roomNet,
    foodSubtotalRaw,
    foodDiscountAmount,
    foodSubtotalAfterDiscount,
    foodCGST,
    foodSGST,
    foodTotal,
    roundOffEnabled: booking.roundOffEnabled,
    grandTotal,
    balance,
  };

  // ---------------- Handlers -----------------
  const handleCheckout = async () => {
    if (!booking?._id) return;
    setCheckingOut(true);

    try {
      await checkoutBookingApi(booking._id, {
        finalPaymentReceived,
        finalPaymentMode,
      });
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
      toast.success("Booking cancelled successfully");
      navigate("/rooms");
    } catch (e: any) {
      if (e?.response?.data?.code === "BOOKING_HAS_ORDERS") {
        toast.error(
          "Cannot cancel this booking because food or room-service orders are already added. Please checkout the guest instead.",
        );
      } else {
        toast.error(e?.response?.data?.message || "Failed to cancel booking");
      }
    }
  };

  const loadAvailableRooms = async () => {
    if (!booking?.room_id?.type) return;

    try {
      const rooms = await getAvailableRoomsApi(booking.room_id.type);

      // Remove current room from the list
      const filteredRooms = rooms.filter(
        (r: any) => r._id !== booking.room_id._id,
      );

      setAvailableRooms(filteredRooms);
    } catch {
      setAvailableRooms([]);
    }
  };
  const refreshBooking = async () => {
    try {
      const updated = await getBookingApi(booking._id);
      setBooking(updated);

      const foodRes = await getRoomServiceBillForBookingApi(booking._id);
      setRoomOrders(foodRes.orders || []);
      setRoomOrderSummary(foodRes.summary || null);
    } catch (e) {
      console.error(e);
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/rooms")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h1 className="text-3xl font-bold">Booking Details</h1>
              <p className="text-muted-foreground">
                Room {booking?.room_id?.number || roomId} —{" "}
                {booking?.room_id?.type || ""}
              </p>
            </div>
          </div>

          <Badge className="bg-room-occupied text-white">Occupied</Badge>
        </div>

        {/* Guest Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Guest Information</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setGuestForm(booking);
                setEditGuestOpen(true);
              }}
            >
              Edit
            </Button>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <strong>Name:</strong> {booking.guestName}
            </p>
            <p>
              <strong>Phone:</strong> {booking.guestPhone}
            </p>

            <p>
              <strong>City:</strong> {booking.guestCity || "—"}
            </p>
            <p>
              <strong>Nationality:</strong> {booking.guestNationality || "—"}
            </p>

            <p>
              <strong>Adults:</strong> {booking.adults}
            </p>
            <p>
              <strong>Children:</strong> {booking.children}
            </p>

            <p>
              <strong>Plan:</strong> {readablePlan(booking.planCode)}
            </p>
            <p>
              <strong>Advance Mode:</strong>{" "}
              {booking.advancePaymentMode || "N/A"}
            </p>

            <div className="md:col-span-2">
              <p>
                <strong>Address:</strong> {booking.guestAddress || "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Guest ID Proofs */}
        {booking.guestIds && booking.guestIds.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Guest ID Proofs</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setGuestIdsForm(booking.guestIds || []);
                  setEditGuestIdsOpen(true);
                }}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.guestIds.map((id: any, idx: number) => (
                <div
                  key={idx}
                  className="border p-3 rounded-md bg-secondary/30 space-y-1"
                >
                  <p>
                    <strong>ID Type:</strong> {id.type}
                  </p>
                  <p>
                    <strong>ID Number:</strong> {id.idNumber}
                  </p>
                  <p>
                    <strong>Name on ID:</strong> {id.nameOnId}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {(booking.companyName || booking.companyGSTIN) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Company / GST Details</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCompanyForm({
                    companyName: booking.companyName,
                    companyGSTIN: booking.companyGSTIN,
                    companyAddress: booking.companyAddress,
                  });
                  setEditCompanyOpen(true);
                }}
              >
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>
                <strong>Company Name:</strong> {booking.companyName || "—"}
              </p>
              <p>
                <strong>GSTIN:</strong> {booking.companyGSTIN || "—"}
              </p>
              <p>
                <strong>Company Address:</strong>{" "}
                {booking.companyAddress || "—"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stay Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Stay Details</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReduceCheckOut("");
                setReduceStayOpen(true);
              }}
            >
              Reduce Stay
            </Button>
          </CardHeader>
          <CardContent>
            <p>
              <strong>Check-in:</strong> {formatLocal(booking.checkIn)}
            </p>

            <p>
              <strong>Check-out:</strong> {formatLocal(booking.checkOut)}
            </p>

            <p>
              <strong>Nights:</strong> {nights}
            </p>
          </CardContent>
        </Card>
        {/* {booking.addedServices?.length > 0 && ( */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Extra Services</CardTitle>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setServicesForm(
                  JSON.parse(JSON.stringify(booking.addedServices || [])),
                );
                setEditServicesOpen(true);
              }}
            >
              Edit Services
            </Button>
          </CardHeader>

          <CardContent className="space-y-2">
            {(booking.addedServices || []).map((s: any, i: number) => {
              const c = calcExtraServiceAmount(s, nights);

              return (
                <div
                  key={i}
                  className="border rounded-md p-3 bg-background space-y-1 text-sm"
                >
                  <div className="flex justify-between font-medium">
                    <span>
                      {s.name}
                      {c.days.length > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          ({c.days.length} day{c.days.length > 1 ? "s" : ""})
                        </span>
                      )}
                    </span>
                    <span>₹{fmt(c.base)}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>GST Applied</span>
                    <span>{c.gstEnabled ? "Yes (5%)" : "No"}</span>
                  </div>

                  {c.gstEnabled && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>CGST (2.5%)</span>
                        <span>₹{fmt(c.cgst)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>SGST (2.5%)</span>
                        <span>₹{fmt(c.sgst)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Service Total</span>
                    <span>₹{fmt(c.total)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        {/* )} */}

        {/* Billing */}
        {/* BILLING SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* ░░░░░░░░░░░ ROOM BILLING (Collapsible) ░░░░░░░░░░░ */}
            <details className="border rounded-md p-4 bg-secondary/20">
              <summary className="cursor-pointer font-semibold text-lg">
                Room Billing
              </summary>

              <div className="mt-4 space-y-3">
                {/* Nightly stay details */}
                <div className="flex justify-between">
                  <span>
                    Room ({nights} nights × ₹{fmt(roomPrice)})
                  </span>
                  <span>₹{fmt(roomStayTotal)}</span>
                </div>

                {(booking.addedServices || []).map((s: any, i: number) => {
                  const c = calcExtraServiceAmount(s, nights);

                  return (
                    <div key={i} className="flex justify-between">
                      <span>
                        {s.name} ({c.qty} {c.qty > 1 ? "days" : "day"} × ₹
                        {fmt(s.price)})
                      </span>
                      <span>₹{fmt(c.base)}</span>
                    </div>
                  );
                })}

                <hr />

                {/* GST */}
                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>₹{fmt(billingData.roomCGST)}</span>
                </div>

                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>₹{fmt(billingData.roomSGST)}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between">
                  <span>Room Discount ({booking.discount}%)</span>
                  <span>- ₹{fmt(billingData.roomDiscountAmount)}</span>
                </div>

                {/* Room Total */}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Room Total</span>
                  <span>₹{fmt(billingData.roomNet)}</span>
                </div>

                {/* Editable fields */}
                <div className="mt-4 border-t pt-4 space-y-3">
                  {/* GST Toggle */}
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Apply Room GST</label>
                    <input
                      type="checkbox"
                      checked={booking.gstEnabled}
                      onChange={async (e) => {
                        try {
                          await updateRoomBillingApi(booking._id, {
                            discount: booking.discount,
                            gstEnabled: e.target.checked,
                          });
                          toast.success("Room GST updated");
                          refreshBooking();
                        } catch {
                          toast.error("Failed to update room GST");
                        }
                      }}
                    />
                  </div>

                  {/* Discount field */}
                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      Room Discount (%)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter discount %"
                        value={roomDiscountInput}
                        onChange={(e) => setRoomDiscountInput(e.target.value)}
                      />

                      <Button
                        disabled={roomDiscountInput === ""}
                        onClick={async () => {
                          try {
                            await updateRoomBillingApi(booking._id, {
                              discount: Number(roomDiscountInput),
                              gstEnabled: booking.gstEnabled,
                            });
                            toast.success("Room discount applied");
                            refreshBooking();
                          } catch {
                            toast.error("Failed to apply room discount");
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* ░░░░░░░░░░░ FOOD BILLING (Collapsible) ░░░░░░░░░░░ */}
            <details className="border rounded-md p-4 bg-secondary/20">
              <summary className="cursor-pointer font-semibold text-lg">
                Food Billing
              </summary>
              {/* FOOD ORDERS SECTION */}
              {roomOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Food / Room Service Orders</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {roomOrders.map((order: any) => (
                      <div
                        key={order._id}
                        className="border p-3 rounded-md bg-secondary/30 space-y-2"
                      >
                        {/* Order Header */}
                        <div className="flex justify-between font-medium">
                          <span>Order #{String(order._id).slice(-6)}</span>
                          <span>{formatLocal(order.createdAt)}</span>
                        </div>

                        {/* Items */}
                        <div className="ml-2">
                          {order.items.map((it: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-sm flex justify-between"
                            >
                              <span>
                                {it.name} × {it.qty}
                              </span>
                              <span>₹{fmt(it.totalPrice)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Subtotal, GST, Total */}
                        {/* <div className="border-t pt-2 mt-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{fmt(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span>GST</span>
              <span>₹{fmt(order.gst)}</span>
            </div>

            <div className="flex justify-between font-semibold text-md">
              <span>Total</span>
              <span>₹{fmt(order.total)}</span>
            </div>
          </div> */}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="mt-4 space-y-3">
                {/* Food Subtotal */}
                <div className="flex justify-between">
                  <span>Food Subtotal</span>
                  <span>₹{fmt(foodSubtotalRaw)}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between">
                  <span>Food Discount ({booking.foodDiscount}%)</span>
                  <span>- ₹{fmt(foodDiscountAmount)}</span>
                </div>

                {/* CGST */}
                <div className="flex justify-between">
                  <span>CGST (2.5%)</span>
                  <span>₹{fmt(foodCGST)}</span>
                </div>

                {/* SGST */}
                <div className="flex justify-between">
                  <span>SGST (2.5%)</span>
                  <span>₹{fmt(foodSGST)}</span>
                </div>

                {/* Total */}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Food Total</span>
                  <span>₹{fmt(foodTotal)}</span>
                </div>

                {/* Editable food billing controls */}
                <div className="mt-4 border-t pt-4 space-y-3">
                  {/* GST Toggle */}
                  <div className="flex justify-between items-center">
                    <label className="font-medium">Apply Food GST</label>
                    <input
                      type="checkbox"
                      checked={booking.foodGSTEnabled}
                      onChange={async (e) => {
                        try {
                          await updateFoodBillingApi(booking._id, {
                            foodDiscount: booking.foodDiscount,
                            foodGSTEnabled: e.target.checked,
                          });
                          const foodRes = await getRoomServiceBillForBookingApi(
                            booking._id,
                          );
                          setRoomOrders(foodRes.orders || []);
                          setRoomOrderSummary(foodRes.summary || null);
                          toast.success("Food GST updated");
                          refreshBooking();
                        } catch {
                          toast.error("Failed to update food GST");
                        }
                      }}
                    />
                  </div>

                  {/* Discount Field */}
                  <div>
                    <label className="block text-sm mb-1 font-medium">
                      Food Discount (%)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter food discount %"
                        value={foodDiscountInput}
                        onChange={(e) => setFoodDiscountInput(e.target.value)}
                      />

                      <Button
                        disabled={foodDiscountInput === ""}
                        onClick={async () => {
                          try {
                            await updateFoodBillingApi(booking._id, {
                              foodDiscount: Number(foodDiscountInput),
                              foodGSTEnabled: booking.foodGSTEnabled,
                            });
                            toast.success("Food discount applied");
                            refreshBooking();
                          } catch {
                            toast.error("Failed to apply food discount");
                          }
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </details>

            {/* ░░░░░░░░░░░ FINAL TOTAL ░░░░░░░░░░░ */}
            <div className="border rounded-md p-4 bg-secondary/30 space-y-3">
              <div className="flex justify-between font-medium">
                <span>Grand Total</span>
                <span>₹{fmt(grandTotal)}</span>
              </div>

              <div className="flex justify-between text-success">
                <span>Advance Paid ( Room )</span>
                <span>₹{fmt(booking.advancePaid)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Balance Due</span>
                <span className="text-warning">
                  ₹{finalPaymentReceived ? fmt(0) : fmt(balance)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <label className="font-medium">Round Off Total</label>
                <input
                  type="checkbox"
                  checked={booking.roundOffEnabled}
                  onChange={async (e) => {
                    try {
                      await updateRoomBillingApi(booking._id, {
                        discount: booking.discount,
                        discountScope: booking.discountScope,
                        gstEnabled: booking.gstEnabled,
                        roundOffEnabled: e.target.checked,
                      });
                      toast.success("Round-off updated");
                      refreshBooking();
                    } catch {
                      toast.error("Failed to update round-off");
                    }
                  }}
                />
              </div>
              {booking.roundOffEnabled && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Round Off Adjustment</span>
                  <span>₹{fmt(roundOffAmount)}</span>
                </div>
              )}

              {/* FINAL PAYMENT SECTION */}
              <div className="space-y-3 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={finalPaymentReceived}
                    onChange={(e) => setFinalPaymentReceived(e.target.checked)}
                  />
                  Final Payment Received
                </label>

                {finalPaymentReceived && (
                  <select
                    className="border rounded p-2 w-full"
                    value={finalPaymentMode}
                    onChange={(e) => setFinalPaymentMode(e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Card</option>
                    <option value="ONLINE">Online</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="OTHER">Other</option>
                  </select>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-4">
          {/* PRIMARY ACTIONS */}
          <div className="flex flex-wrap gap-4">
            <Button
              disabled={checkingOut}
              onClick={() => setConfirmCheckout(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {checkingOut ? "Processing..." : "Mark Check-out"}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                loadAvailableRooms();
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

          {/* DANGER ZONE */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-4">
              <Button
                variant="destructive"
                disabled={roomOrders.length > 0}
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Booking
              </Button>

              {roomOrders.length > 0 && (
                <span className="text-sm text-red-600">
                  Food / room-service orders exist. Checkout required.
                </span>
              )}
            </div>
          </div>
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
              <Button
                variant="outline"
                onClick={() => setShowChangeRoom(false)}
              >
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
                    toast.error(
                      e?.response?.data?.message || "Failed to change room",
                    );
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
            <DialogHeader>
              <DialogTitle>Extend Stay</DialogTitle>
            </DialogHeader>

            <p>New Checkout Date:</p>
            <Input
              type="datetime-local"
              value={newCheckOut}
              onChange={(e) => setNewCheckOut(e.target.value)}
              className="mt-2"
            />

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowExtendStay(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const res = await extendStayApi(
                      booking._id,
                      toUTCISOString(newCheckOut),
                    );

                    if (res.warning) {
                      toast.warning(res.message);
                    } else {
                      toast.success("Stay extended successfully");
                    }

                    refreshBooking();
                    setShowExtendStay(false);
                  } catch (e: any) {
                    if (e?.response?.data?.message) {
                      toast.error(e.response.data.message);
                    } else {
                      toast.error("Failed to extend stay");
                    }
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
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
            </DialogHeader>

            <p>Are you sure you want to cancel this booking?</p>

            <DialogFooter className="mt-4 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
              >
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
              <Button
                variant="outline"
                onClick={() => setConfirmCheckout(false)}
              >
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
              <DialogTitle>Select Invoice Type</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-3">
              <Button
                className="w-full"
                onClick={() =>
                  openPrintWindow(
                    buildRoomInvoice(
                      booking,
                      hotel,
                      billingData,
                      finalPaymentReceived,
                      finalPaymentMode,
                    ),
                  )
                }
              >
                Room Invoice Only
              </Button>

              <Button
                className="w-full"
                onClick={() =>
                  openPrintWindow(
                    buildFoodInvoice(
                      booking,
                      hotel,
                      billingData,
                      roomOrders,
                      finalPaymentReceived,
                      finalPaymentMode,
                    ),
                  )
                }
                disabled={roomOrders.length === 0}
              >
                Food Invoice Only
              </Button>

              <Button
                className="w-full"
                onClick={() =>
                  openPrintWindow(
                    buildCombinedInvoice(
                      booking,
                      hotel,
                      billingData,
                      roomOrders,
                      finalPaymentReceived,
                      finalPaymentMode,
                    ),
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
        <Dialog open={editGuestOpen} onOpenChange={setEditGuestOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Guest Information</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Guest Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Guest Name
                </label>
                <Input
                  value={guestForm.guestName || ""}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, guestName: e.target.value })
                  }
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Phone Number
                </label>
                <Input
                  value={guestForm.guestPhone || ""}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, guestPhone: e.target.value })
                  }
                />
              </div>

              {/* City */}
              <div>
                <label className="text-sm font-medium mb-1 block">City</label>
                <Input
                  value={guestForm.guestCity || ""}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, guestCity: e.target.value })
                  }
                />
              </div>

              {/* Nationality */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Nationality
                </label>
                <Input
                  value={guestForm.guestNationality || ""}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      guestNationality: e.target.value,
                    })
                  }
                />
              </div>

              {/* Adults */}
              <div>
                <label className="text-sm font-medium mb-1 block">Adults</label>
                <Input
                  type="number"
                  min={1}
                  value={guestForm.adults ?? ""}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      adults: Number(e.target.value),
                    })
                  }
                />
              </div>

              {/* Children */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Children
                </label>
                <Input
                  type="number"
                  min={0}
                  value={guestForm.children ?? ""}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      children: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Address */}
            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">
                Guest Address
              </label>
              <Input
                value={guestForm.guestAddress || ""}
                onChange={(e) =>
                  setGuestForm({ ...guestForm, guestAddress: e.target.value })
                }
              />
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setEditGuestOpen(false)}>
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await updateGuestInfoApi(booking._id, {
                      guestName: guestForm.guestName,
                      guestPhone: guestForm.guestPhone,
                      guestCity: guestForm.guestCity,
                      guestNationality: guestForm.guestNationality,
                      guestAddress: guestForm.guestAddress,
                      adults: guestForm.adults,
                      children: guestForm.children,
                    });

                    toast.success("Guest information updated");
                    refreshBooking();
                    setEditGuestOpen(false);
                  } catch (e: any) {
                    toast.error(
                      e?.response?.data?.message ||
                        "Failed to update guest information",
                    );
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editGuestIdsOpen} onOpenChange={setEditGuestIdsOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Guest ID Proofs</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {guestIdsForm.map((id, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border p-3 rounded-lg"
                >
                  {/* ID Type */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      ID Type
                    </label>
                    <select
                      value={id.type}
                      onChange={(e) => {
                        const copy = [...guestIdsForm];
                        copy[idx].type = e.target.value;
                        setGuestIdsForm(copy);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select ID</option>
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                    </select>
                  </div>

                  {/* ID Number */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      ID Number
                    </label>
                    <Input
                      value={id.idNumber}
                      onChange={(e) => {
                        const copy = [...guestIdsForm];
                        copy[idx].idNumber = e.target.value;
                        setGuestIdsForm(copy);
                      }}
                    />
                  </div>

                  {/* Name on ID + Delete Button */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5">
                        Name on ID
                      </label>
                      <Input
                        placeholder="Name on ID"
                        value={id.nameOnId}
                        onChange={(e) => {
                          const copy = [...guestIdsForm];
                          copy[idx].nameOnId = e.target.value;
                          setGuestIdsForm(copy);
                        }}
                      />
                    </div>

                    <Button
                      variant="destructive"
                      size="icon"
                      className="mt-6"
                      onClick={() =>
                        setGuestIdsForm(
                          guestIdsForm.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {guestIdsForm.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No guest IDs added yet.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={async () => {
                  await updateGuestIdsApi(booking._id, guestIdsForm);
                  toast.success("Guest IDs updated");
                  refreshBooking();
                  setEditGuestIdsOpen(false);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Company / GST Details</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Name
                </label>
                <Input
                  placeholder="Enter company name"
                  value={companyForm.companyName || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      companyName: e.target.value,
                    })
                  }
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <Input
                  placeholder="Enter GST number"
                  value={companyForm.companyGSTIN || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      companyGSTIN: e.target.value,
                    })
                  }
                />
              </div>

              {/* Company Address */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Address
                </label>
                <Input
                  placeholder="Enter company address"
                  value={companyForm.companyAddress || ""}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      companyAddress: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setEditCompanyOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  await updateCompanyDetailsApi(booking._id, companyForm);
                  toast.success("Company / GST details updated");
                  refreshBooking();
                  setEditCompanyOpen(false);
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={reduceStayOpen} onOpenChange={setReduceStayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reduce Stay</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground">
              Current checkout: {formatLocal(booking.checkOut)}
            </p>

            <Input
              type="datetime-local"
              value={reduceCheckOut}
              onChange={(e) => setReduceCheckOut(e.target.value)}
            />

            <DialogFooter>
              <Button
                onClick={async () => {
                  await reduceStayApi(
                    booking._id,
                    toUTCISOString(reduceCheckOut),
                  );

                  toast.success("Stay reduced");
                  refreshBooking();
                  setReduceStayOpen(false);
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editServicesOpen} onOpenChange={setEditServicesOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit Extra Services</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto">
              {servicesForm.map((s, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-3">
                  {/* Service name + delete */}
                  <div className="flex gap-3 items-center">
                    <Input
                      placeholder="Service name"
                      value={s.name}
                      onChange={(e) => {
                        const copy = [...servicesForm];
                        copy[idx].name = e.target.value;
                        setServicesForm(copy);
                      }}
                    />

                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        setServicesForm(
                          servicesForm.filter((_, i) => i !== idx),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Price + GST toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={s.price}
                      onChange={(e) => {
                        const copy = [...servicesForm];
                        copy[idx].price = Number(e.target.value);
                        setServicesForm(copy);
                      }}
                    />

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={s.gstEnabled !== false}
                        onChange={(e) => {
                          const copy = [...servicesForm];
                          copy[idx].gstEnabled = e.target.checked;
                          setServicesForm(copy);
                        }}
                      />
                      Apply GST (5%)
                    </label>
                  </div>

                  {/* Days selector */}
                  <div>
                    <p className="text-sm font-medium mb-2">Applicable Days</p>
                    <div className="flex flex-wrap gap-3">
                      {Array.from({ length: nights }, (_, i) => i + 1).map(
                        (day) => (
                          <label
                            key={day}
                            className="flex items-center gap-1 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={s.days?.includes(day)}
                              onChange={() => {
                                const copy = [...servicesForm];
                                copy[idx].days = s.days?.includes(day)
                                  ? copy[idx].days.filter(
                                      (d: number) => d !== day,
                                    )
                                  : [...(copy[idx].days || []), day];
                                setServicesForm(copy);
                              }}
                            />
                            Day {day}
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() =>
                  setServicesForm([
                    ...servicesForm,
                    { name: "", price: 0, days: [], gstEnabled: true },
                  ])
                }
              >
                + Add Service
              </Button>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditServicesOpen(false)}
              >
                Cancel
              </Button>

              <Button
                onClick={async () => {
                  try {
                    await updateBookingServicesApi(booking._id, servicesForm);
                    toast.success("Extra services updated");
                    refreshBooking();
                    setEditServicesOpen(false);
                  } catch {
                    toast.error("Failed to update services");
                  }
                }}
              >
                Save Services
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
