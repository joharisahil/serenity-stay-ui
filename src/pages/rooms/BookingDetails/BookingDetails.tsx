import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";

import {
  getAvailableRoomsApi,
  addAdvancePaymentApi,
  deleteAdvancePaymentApi,
} from "@/api/bookingApi";

import { GuestInfoSection } from "./components/GuestInfoSection";
import { ExtraServicesSection } from "./components/ExtraServicesSection";
import { StayDetailsSection } from "./components/StayDetailsSection";
import { RoomChargesSection } from "./components/RoomChargesSection";
import { FoodBillingSection } from "./components/FoodBillingSection";
import { AdvancePaymentsSection } from "./components/AdvancePaymentsSection";
import { BillingSummarySection } from "./components/BillingSummarySection";
import { ActionButtons } from "./components/ActionButtons";

import { getNights } from "./utils/getNights";
import { useBooking } from "./hooks/useBooking";
import { useAdvancePayments } from "./hooks/useAdvancePayments";

import { toast } from "react-hot-toast";

export default function BookingDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();

  const passedBookingId = location.state?.bookingId || null;
  const selectedCheckIn = location.state?.selectedCheckIn || null;
  const selectedCheckOut = location.state?.selectedCheckOut || null;

  const [pageRefreshing, setPageRefreshing] = useState(false);
  const [finalPaymentReceived, setFinalPaymentReceived] = useState(false);
  const [finalPaymentMode, setFinalPaymentMode] = useState("CASH");

  /* ================= FETCH BOOKING ================= */

  const {
    booking,
    roomOrders,
    setRoomOrders,
    roomOrderSummary,
    setRoomOrderSummary,
    hotel,
    availableRooms,
    setAvailableRooms,
    loading,
    refreshBooking,
  } = useBooking({
    roomId,
    passedBookingId,
    selectedCheckIn,
    selectedCheckOut,
  });

  /* ================= ADVANCE PAYMENTS ================= */

  const {
    advances,
    setAdvances,
    addAdvance,
    updateAdvance,
    totalAdvance,
  } = useAdvancePayments(booking?.advances || []);

  const hardRefreshPage = async () => {
    if (!booking?._id) return;
    setPageRefreshing(true);
    try {
      await refreshBooking(booking._id);
    } finally {
      setPageRefreshing(false);
    }
  };

  const handleDepositAdvance = async (index: number) => {
    if (!booking?._id) return;
    try {
      await addAdvancePaymentApi(booking._id, advances[index]);
      toast.success("Advance deposited");
      setAdvances([]);
      await refreshBooking(booking._id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to deposit advance");
    }
  };

  const handleDeleteAdvance = async (advanceId: string) => {
    if (!booking?._id) return;
    try {
      await deleteAdvancePaymentApi(booking._id, advanceId);
      toast.success("Advance deleted");
      setAdvances([]);
      await refreshBooking(booking._id);
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? "Failed to delete advance");
    }
  };

  /* ================= AVAILABLE ROOMS ================= */

  const loadAvailableRooms = async () => {
    if (!booking?.room_id?.type) return;
    try {
      const rooms = await getAvailableRoomsApi(booking.room_id.type);
      setAvailableRooms(
        rooms.filter((r: any) => r._id !== booking.room_id._id)
      );
    } catch {
      setAvailableRooms([]);
    }
  };

  /* ================= BILLING DATA ================= */

  const billingData = booking
    ? {
        nights:
          booking.checkIn && booking.checkOut
            ? getNights(booking.checkIn, booking.checkOut)
            : 1,
        roomPrice: booking.room_id?.baseRate || 0,
        roomStayTotal: booking.roomStayTotal ?? 0,
        extrasBase: booking.extrasBase || 0,
        extrasGST: booking.extrasGST || 0,
        extrasTotal: booking.extrasTotal || 0,
        taxable: booking.taxable || 0,
        cgst: booking.cgst || 0,
        sgst: booking.sgst || 0,
        foodTotals: booking.foodTotals || { subtotal: 0, gst: 0, total: 0 },
        advancePaid: booking.advancePaid || 0,
        balanceDue: booking.balanceDue || 0,
        roundOffAmount: booking.roundOffAmount || 0,
        roundOffEnabled: booking.roundOffEnabled,
        grandTotal: booking.grandTotal ?? 0,
      }
    : null;

  /* ================= LOADING STATES ================= */

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="text-center py-24">
          <h1 className="text-xl font-bold">No active booking</h1>
          <Button className="mt-4" onClick={() => navigate("/rooms")}>
            Back to Rooms
          </Button>
        </div>
      </Layout>
    );
  }

  /* ================= UI ================= */

  return (
    <Layout>
      {pageRefreshing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div className="mb-6 flex items-center justify-between">
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

      {/* ===== ERP TWO-COLUMN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT — OPERATIONS */}
        <div className="lg:col-span-8 space-y-6">
          <GuestInfoSection booking={booking} onRefresh={refreshBooking} />

          <StayDetailsSection
            booking={booking}
            billingData={billingData}
            onRefresh={hardRefreshPage}
          />

          <ExtraServicesSection
            booking={booking}
            onRefresh={hardRefreshPage}
          />

          <RoomChargesSection
            booking={booking}
            billingData={billingData}
            onRefresh={hardRefreshPage}
          />

          <FoodBillingSection
            booking={booking}
            roomOrders={roomOrders}
            setRoomOrders={setRoomOrders}
            roomOrderSummary={roomOrderSummary}
            setRoomOrderSummary={setRoomOrderSummary}
            onRefresh={hardRefreshPage}
          />

          <AdvancePaymentsSection
            advances={advances}
            totalAdvance={totalAdvance}
            onAddAdvance={addAdvance}
            onUpdateAdvance={updateAdvance}
            onDepositAdvance={handleDepositAdvance}
            onDeleteAdvance={handleDeleteAdvance}
          />

        </div>

        {/* RIGHT — FINANCE */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-6">
            <BillingSummarySection
              booking={booking}
              billingData={billingData}
              totalAdvance={booking.advancePaid}
              finalPaymentReceived={finalPaymentReceived}
              finalPaymentMode={finalPaymentMode}
              onFinalPaymentReceivedChange={setFinalPaymentReceived}
              onFinalPaymentModeChange={setFinalPaymentMode}
              onRefresh={hardRefreshPage}
            />
            
          <ActionButtons
            booking={booking}
            billingData={billingData}
            hotel={hotel}
            roomOrders={roomOrders}
            availableRooms={availableRooms}
            finalPaymentReceived={finalPaymentReceived}
            finalPaymentMode={finalPaymentMode}
            onLoadAvailableRooms={loadAvailableRooms}
          />
          </div>
        </div>

      </div>
    </Layout>
  );
}

/*old ui*/

// import { useState } from "react";
// import { useLocation, useNavigate, useParams } from "react-router-dom";
// import { Layout } from "@/components/layout/Layout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// import { ArrowLeft, Loader2 } from "lucide-react";

// import {
//   getAvailableRoomsApi,
//   addAdvancePaymentApi,
//   deleteAdvancePaymentApi,
// } from "@/api/bookingApi";

// import { GuestInfoSection } from "./components/GuestInfoSection";
// import { ExtraServicesSection } from "./components/ExtraServicesSection";
// import { StayDetailsSection } from "./components/StayDetailsSection";
// import { RoomChargesSection } from "./components/RoomChargesSection";
// import { FoodBillingSection } from "./components/FoodBillingSection";
// import { AdvancePaymentsSection } from "./components/AdvancePaymentsSection";
// import { BillingSummarySection } from "./components/BillingSummarySection";
// import { ActionButtons } from "./components/ActionButtons";
// import { getNights } from "./utils/getNights";
// import { useBooking } from "./hooks/useBooking";
// import { useAdvancePayments } from "./hooks/useAdvancePayments";

// import { toast } from "react-hot-toast";
// import { fmt } from "./utils/formatters";

// export default function BookingDetails() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { roomId } = useParams();
//   const passedBookingId = location.state?.bookingId || null;
//   const selectedCheckIn = location.state?.selectedCheckIn || null;
//   const selectedCheckOut = location.state?.selectedCheckOut || null;
//   const [pageRefreshing, setPageRefreshing] = useState(false);

//   const hardRefreshPage = async () => {
//     if (!booking?._id) return;

//     setPageRefreshing(true);

//     try {
//       await refreshBooking(booking._id);
//     } finally {
//       setPageRefreshing(false);
//     }
//   };

//   // Fetch booking, hotel, roomOrders, etc.
//   const {
//     booking,
//     roomOrders,
//     setRoomOrders,
//     roomOrderSummary,
//     setRoomOrderSummary,
//     hotel,
//     availableRooms,
//     setAvailableRooms,
//     loading,
//     refreshBooking,
//   } = useBooking({
//     roomId,
//     passedBookingId,
//     selectedCheckIn,
//     selectedCheckOut,
//   });

//   // Advance payments handling
//   const {
//     advances,
//     setAdvances,
//     addAdvance,
//     updateAdvance,
//     removeAdvance,
//     totalAdvance,
//   } = useAdvancePayments(booking?.advances || []);

//   // ✅ Use backend-provided billing values directly
//   // utils/booking.ts

//   const billingData = booking
//     ? {
//         nights:
//           booking.checkIn && booking.checkOut
//             ? getNights(booking.checkIn, booking.checkOut)
//             : 1, // fallback if dates are missing
//         roomPrice: booking.room_id?.baseRate || 0,
//         //roomStayTotal: booking.roomStayTotal || booking.room_id?.baseRate || 0,

//         roomStayTotal: booking.roomStayTotal ?? 0,

//         extrasBase: booking.extrasBase || 0,
//         extrasGST: booking.extrasGST || 0,
//         extrasTotal: booking.extrasTotal || 0,
//         taxable: booking.taxable || 0,
//         cgst: booking.cgst || 0,
//         sgst: booking.sgst || 0,
//         foodTotals: booking.foodTotals || { subtotal: 0, gst: 0, total: 0 },
//         advancePaid: booking.advancePaid || 0,
//         balanceDue: booking.balanceDue || 0,
//         roundOffAmount: booking.roundOffAmount || 0,
//         roundOffEnabled: booking.roundOffEnabled,
//         grandTotal: booking.grandTotal ?? 0,
//       }
//     : null;

//   const [finalPaymentReceived, setFinalPaymentReceived] = useState(false);
//   const [finalPaymentMode, setFinalPaymentMode] = useState("CASH");

//   // Deposit advance payment
//   // const handleDepositAdvance = async (index: number) => {
//   //   if (!booking?._id) return;
//   //   const adv = advances[index];

//   //   try {
//   //     const res = await addAdvancePaymentApi(booking._id, adv);

//   //     setAdvances((prev) =>
//   //       prev.map((a, i) => (i === index ? res.advance : a))
//   //     );

//   //     toast.success("Advance deposited");
//   //     refreshBooking();
//   //   } catch (e: any) {
//   //     toast.error(e?.response?.data?.message || "Failed to deposit advance");
//   //   }
//   // };
//   // Deposit advance

//   const handleDepositAdvance = async (index: number) => {
//     if (!booking?._id) return;

//     try {
//       const advance = advances[index]; // ✅ local draft

//       await addAdvancePaymentApi(booking._id, advance);

//       toast.success("Advance deposited");

//       setAdvances([]); // clear drafts
//       await refreshBooking(booking._id); // 🔥 force backend truth
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message ?? "Failed to deposit advance");
//     }
//   };

//   // Delete advance
//   const handleDeleteAdvance = async (advanceId: string) => {
//     if (!booking?._id) return;

//     try {
//       await deleteAdvancePaymentApi(booking._id, advanceId);

//       toast.success("Advance deleted");

//       setAdvances([]);
//       await refreshBooking(booking._id);
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message ?? "Failed to delete advance");
//     }
//   };

//   // Load other available rooms
//   const loadAvailableRooms = async () => {
//     if (!booking?.room_id?.type) return;

//     try {
//       const rooms = await getAvailableRoomsApi(booking.room_id.type);
//       const filteredRooms = rooms.filter(
//         (r: any) => r._id !== booking.room_id._id
//       );
//       setAvailableRooms(filteredRooms);
//     } catch {
//       setAvailableRooms([]);
//     }
//   };

//   if (loading)
//     return (
//       <Layout>
//         <div className="flex items-center justify-center py-20">
//           <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         </div>
//       </Layout>
//     );

//   if (!booking)
//     return (
//       <Layout>
//         <div className="text-center py-20">
//           <h1 className="text-xl font-bold">No active booking for this room</h1>
//           <Button className="mt-4" onClick={() => navigate("/rooms")}>
//             Back to Rooms
//           </Button>
//         </div>
//       </Layout>
//     );

//   return (
//     <Layout>
//       {pageRefreshing && (
//         <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
//           <Loader2 className="h-10 w-10 animate-spin text-white" />
//         </div>
//       )}

//       <div className="space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => navigate("/rooms")}
//             >
//               <ArrowLeft className="h-5 w-5" />
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold">Booking Details</h1>
//               <p className="text-muted-foreground">
//                 Room {booking?.room_id?.number || roomId} —{" "}
//                 {booking?.room_id?.type || ""}
//               </p>
//             </div>
//           </div>
//           <Badge className="bg-room-occupied text-white">Occupied</Badge>
//         </div>

//         {/* Guest Info */}
//         <GuestInfoSection booking={booking} onRefresh={refreshBooking} />

//         {/* Stay Details */}
//         <StayDetailsSection
//           booking={booking}
//           billingData={billingData}
//           onRefresh={hardRefreshPage}
//         />

//         {/*Extra Servies */}
//         <ExtraServicesSection booking={booking} onRefresh={hardRefreshPage} />
//         {/* Room Charges */}
//         <RoomChargesSection
//           booking={booking}
//           billingData={billingData}
//           onRefresh={hardRefreshPage}
//         />

//         {/* Food Billing */}
//         <FoodBillingSection
//           booking={booking}
//           roomOrders={roomOrders}
//           setRoomOrders={setRoomOrders}
//           roomOrderSummary={roomOrderSummary}
//           setRoomOrderSummary={setRoomOrderSummary}
//           onRefresh={hardRefreshPage}
//         />

//         {/* Advance Payments */}
//         <AdvancePaymentsSection
//           advances={advances}
//           totalAdvance={totalAdvance}
//           onAddAdvance={addAdvance}
//           onUpdateAdvance={updateAdvance}
//           onDepositAdvance={handleDepositAdvance}
//           onDeleteAdvance={handleDeleteAdvance}
//         />

//         {/* Billing Summary */}
//         <BillingSummarySection
//           booking={booking}
//           billingData={billingData}
//           totalAdvance={booking.advancePaid}
//           finalPaymentReceived={finalPaymentReceived}
//           finalPaymentMode={finalPaymentMode}
//           onFinalPaymentReceivedChange={setFinalPaymentReceived}
//           onFinalPaymentModeChange={setFinalPaymentMode}
//           onRefresh={hardRefreshPage}
//         />

//         {/* Actions */}
//         <ActionButtons
//           booking={booking}
//           billingData={billingData}
//           hotel={hotel}
//           roomOrders={roomOrders}
//           availableRooms={availableRooms}
//           finalPaymentReceived={finalPaymentReceived}
//           finalPaymentMode={finalPaymentMode}
//           onLoadAvailableRooms={loadAvailableRooms}
//         />
//       </div>
//     </Layout>
//   );
// }
