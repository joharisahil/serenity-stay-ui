import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle, Edit, Download } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

import {
  checkoutBookingApi,
  cancelBookingApi,
  changeRoomApi,
} from "@/api/bookingApi";

import {
  buildRoomInvoice,
  buildFoodInvoice,
  buildCombinedInvoice,
} from "@/utils/printInvoice";

import {
  Booking,
  Hotel,
  BillingData,
  RoomOrder,
} from "../BookingDetails.types";

interface ActionButtonsProps {
  booking: any;
  billingData: any;
  hotel: any;
  roomOrders: any[];
  availableRooms: any[];
  finalPaymentReceived: boolean;
  finalPaymentMode: string;
  onLoadAvailableRooms?: () => Promise<void>;

}

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

export function ActionButtons({
  booking,
  hotel,
  billingData,
  roomOrders,
  availableRooms,
  finalPaymentReceived,
  finalPaymentMode,
  onLoadAvailableRooms,
}: ActionButtonsProps) {
  const navigate = useNavigate();

  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeRoom, setShowChangeRoom] = useState(false);
  const [newRoomId, setNewRoomId] = useState("");

  /* ===============================
     LOCAL INVOICE PAYMENT STATE
     (frontend-only, safe)
  =============================== */
  const [invoicePaymentReceived, setInvoicePaymentReceived] =
    useState(finalPaymentReceived);
  const [invoicePaymentMode, setInvoicePaymentMode] =
    useState(finalPaymentMode);
  useEffect(() => {
    setInvoicePaymentReceived(finalPaymentReceived);
    setInvoicePaymentMode(finalPaymentMode);
  }, [finalPaymentReceived, finalPaymentMode]);
  /* ================= ACTION HANDLERS ================= */

  const handleCheckout = async () => {
    if (!booking?._id) return;
    setCheckingOut(true);
    try {
      await checkoutBookingApi(booking._id, {
        finalPaymentReceived,
        finalPaymentMode,
      });

      // ✅ sync local invoice state
      setInvoicePaymentReceived(true);
      setInvoicePaymentMode(finalPaymentMode);

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
          "Cannot cancel booking. Orders exist. Please checkout instead.",
        );
      } else {
        toast.error(e?.response?.data?.message || "Cancel failed");
      }
    }
  };

  /* ================= UI ================= */

  return (
    <>
      <div className="space-y-3 text-sm">
        {/* PRIMARY ROW */}
        <div className="grid grid-cols-1">
          <Button
            size="sm"
            className="w-full"
            disabled={checkingOut}
            onClick={() => setConfirmCheckout(true)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {checkingOut ? "Processing..." : "Mark Check-out"}
          </Button>
        </div>

        {/* SECONDARY ROW */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (onLoadAvailableRooms) {
                await onLoadAvailableRooms();
              }
              setShowChangeRoom(true);
            }}
          >
            <Edit className="mr-1.5 h-4 w-4" />
            Change Room
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setInvoiceModal(true)}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Invoice
          </Button>
        </div>

        {/* RISK ROW */}
        <div className="grid grid-cols-1">
          <Button
            size="sm"
            variant="destructive"
            disabled={roomOrders.length > 0}
            onClick={() => setShowCancelModal(true)}
          >
            Cancel Booking
          </Button>

          {roomOrders.length > 0 && (
            <p className="mt-1 text-xs text-destructive text-center">
              Orders exist — checkout required
            </p>
          )}
        </div>
      </div>

      {/* ===== CHANGE ROOM ===== */}
      <Dialog open={showChangeRoom} onOpenChange={setShowChangeRoom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Room</DialogTitle>
          </DialogHeader>

          <select
            className="w-full border rounded p-2 mt-3"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
          >
            <option value="">Select room</option>
            {availableRooms.map((r: any) => (
              <option key={r._id} value={r._id}>
                Room {r.number} ({r.type})
              </option>
            ))}
          </select>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowChangeRoom(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newRoomId}
              onClick={async () => {
                try {
                  await changeRoomApi(booking._id, newRoomId);
                  toast.success("Room changed successfully");
                  navigate("/rooms");
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Change failed");
                }
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CANCEL CONFIRM ===== */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>

          <p>Are you sure you want to cancel this booking?</p>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancelBooking}
            >
              Confirm Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== CHECKOUT CONFIRM ===== */}
      <Dialog open={confirmCheckout} onOpenChange={setConfirmCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Check-out</DialogTitle>
          </DialogHeader>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmCheckout(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== INVOICE ===== */}
      <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full"
              onClick={() =>
                openPrintWindow(
                  buildRoomInvoice(
                    booking,
                    hotel,
                    billingData,
                    invoicePaymentReceived,
                    invoicePaymentMode,
                  ),
                )
              }
            >
              Room Invoice
            </Button>

            <Button
              size="sm"
              className="w-full"
              disabled={roomOrders.length === 0}
              onClick={() =>
                openPrintWindow(
                  buildFoodInvoice(
                    booking,
                    hotel,
                    billingData,
                    roomOrders,
                    invoicePaymentReceived,
                    invoicePaymentMode,
                  ),
                )
              }
            >
              Food Invoice
            </Button>

            <Button
              size="sm"
              className="w-full"
              onClick={() =>
                openPrintWindow(
                  buildCombinedInvoice(
                    booking,
                    hotel,
                    billingData,
                    roomOrders,
                    invoicePaymentReceived,
                    invoicePaymentMode,
                  ),
                )
              }
            >
              Full Invoice (Room + Food)
            </Button>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInvoiceModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/*old ui*/
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { CheckCircle, Edit, Download } from "lucide-react";
// import { toast } from "sonner";
// import {
//   checkoutBookingApi,
//   cancelBookingApi,
//   changeRoomApi,
//   getAvailableRoomsApi,
// } from "@/api/bookingApi";
// import {
//   buildRoomInvoice,
//   buildFoodInvoice,
//   buildCombinedInvoice,
// } from "@/utils/printInvoice";
// import { Booking, Hotel, BillingData, RoomOrder } from "../BookingDetails.types";

// interface ActionButtonsProps {
//   booking: Booking;
//   hotel: Hotel | null;
//   billingData: BillingData | null;
//   roomOrders: RoomOrder[];
//   availableRooms: any[];
//   finalPaymentReceived: boolean;
//   finalPaymentMode: string;
//   onLoadAvailableRooms: () => void;
// }

// const openPrintWindow = (html: string) => {
//   const win = window.open("", "_blank", "width=900,height=800");
//   if (!win) {
//     toast.error("Unable to open print window");
//     return;
//   }
//   win.document.write(html);
//   win.document.close();
//   setTimeout(() => {
//     try {
//       win.focus();
//       win.print();
//     } catch (e) {}
//   }, 300);
// };

// export function ActionButtons({
//   booking,
//   hotel,
//   billingData,
//   roomOrders,
//   availableRooms,
//   finalPaymentReceived,
//   finalPaymentMode,
//   onLoadAvailableRooms,
// }: ActionButtonsProps) {
//   const navigate = useNavigate();

//   const [checkingOut, setCheckingOut] = useState(false);
//   const [confirmCheckout, setConfirmCheckout] = useState(false);
//   const [invoiceModal, setInvoiceModal] = useState(false);
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [showChangeRoom, setShowChangeRoom] = useState(false);
//   const [newRoomId, setNewRoomId] = useState("");

//   const handleCheckout = async () => {
//     if (!booking?._id) return;
//     setCheckingOut(true);

//     try {
//       await checkoutBookingApi(booking._id, {
//         finalPaymentReceived,
//         finalPaymentMode,
//       });
//       toast.success("Guest checked out successfully");
//       navigate("/rooms");
//     } catch (e: any) {
//       toast.error(e?.response?.data?.message || "Checkout failed");
//     } finally {
//       setCheckingOut(false);
//     }
//   };

//   const handleCancelBooking = async () => {
//     try {
//       await cancelBookingApi(booking._id);
//       toast.success("Booking cancelled successfully");
//       navigate("/rooms");
//     } catch (e: any) {
//       if (e?.response?.data?.code === "BOOKING_HAS_ORDERS") {
//         toast.error(
//           "Cannot cancel this booking because food or room-service orders are already added. Please checkout the guest instead."
//         );
//       } else {
//         toast.error(e?.response?.data?.message || "Failed to cancel booking");
//       }
//     }
//   };

//   return (
//     <>
//       <div className="flex flex-col gap-4">
//         <div className="flex flex-wrap gap-4">
//           <Button disabled={checkingOut} onClick={() => setConfirmCheckout(true)}>
//             <CheckCircle className="mr-2 h-4 w-4" />
//             {checkingOut ? "Processing..." : "Mark Check-out"}
//           </Button>

//           <Button
//             variant="outline"
//             onClick={() => {
//               onLoadAvailableRooms();
//               setShowChangeRoom(true);
//             }}
//           >
//             <Edit className="mr-2 h-4 w-4" /> Change Room
//           </Button>

//           <Button variant="outline" onClick={() => setInvoiceModal(true)}>
//             <Download className="mr-2 h-4 w-4" /> Download Invoice
//           </Button>
//         </div>

//         <div className="border-t pt-4">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="destructive"
//               disabled={roomOrders.length > 0}
//               onClick={() => setShowCancelModal(true)}
//             >
//               Cancel Booking
//             </Button>

//             {roomOrders.length > 0 && (
//               <span className="text-sm text-red-600">
//                 Food / room-service orders exist. Checkout required.
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       <Dialog open={showChangeRoom} onOpenChange={setShowChangeRoom}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Change Room</DialogTitle>
//             <p className="text-sm text-muted-foreground">
//               Select an available room of the same category
//             </p>
//           </DialogHeader>

//           <div className="mt-4">
//             <label className="block text-sm mb-2">Available Rooms</label>

//             <select
//               className="w-full border rounded p-2"
//               value={newRoomId}
//               onChange={(e) => setNewRoomId(e.target.value)}
//             >
//               <option value="">-- Select Room --</option>

//               {availableRooms.map((r: any) => (
//                 <option key={r._id} value={r._id}>
//                   Room {r.number} ({r.type})
//                 </option>
//               ))}
//             </select>

//             {availableRooms.length === 0 && (
//               <p className="text-sm text-red-500 mt-2">
//                 No rooms available in this category.
//               </p>
//             )}
//           </div>

//           <DialogFooter className="mt-4">
//             <Button variant="outline" onClick={() => setShowChangeRoom(false)}>
//               Cancel
//             </Button>

//             <Button
//               disabled={!newRoomId}
//               onClick={async () => {
//                 try {
//                   await changeRoomApi(booking._id, newRoomId);
//                   toast.success("Room changed successfully");
//                   navigate("/rooms");
//                 } catch (e: any) {
//                   toast.error(
//                     e?.response?.data?.message || "Failed to change room"
//                   );
//                 }
//               }}
//             >
//               Confirm
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Cancel Booking</DialogTitle>
//           </DialogHeader>

//           <p>Are you sure you want to cancel this booking?</p>

//           <DialogFooter className="mt-4 flex justify-end gap-4">
//             <Button variant="outline" onClick={() => setShowCancelModal(false)}>
//               Close
//             </Button>

//             <Button
//               variant="destructive"
//               onClick={() => {
//                 setShowCancelModal(false);
//                 handleCancelBooking();
//               }}
//             >
//               Confirm Cancel
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={confirmCheckout} onOpenChange={setConfirmCheckout}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Mark Check-out</DialogTitle>
//           </DialogHeader>

//           <p>Are you sure you want to check out this guest?</p>

//           <DialogFooter className="mt-4 flex justify-end gap-4">
//             <Button variant="outline" onClick={() => setConfirmCheckout(false)}>
//               Cancel
//             </Button>

//             <Button
//               disabled={checkingOut}
//               onClick={() => {
//                 setConfirmCheckout(false);
//                 handleCheckout();
//               }}
//             >
//               {checkingOut ? "Processing..." : "Confirm Check-out"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={invoiceModal} onOpenChange={setInvoiceModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Select Invoice Type</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-3 py-3">
//             <Button
//               className="w-full"
//               onClick={() =>
//                 openPrintWindow(
//                   buildRoomInvoice(
//                     booking,
//                     hotel,
//                     billingData,
//                     finalPaymentReceived,
//                     finalPaymentMode
//                   )
//                 )
//               }
//             >
//               Room Invoice Only
//             </Button>

//             <Button
//               className="w-full"
//               onClick={() =>
//                 openPrintWindow(
//                   buildFoodInvoice(
//                     booking,
//                     hotel,
//                     billingData,
//                     roomOrders,
//                     finalPaymentReceived,
//                     finalPaymentMode
//                   )
//                 )
//               }
//               disabled={roomOrders.length === 0}
//             >
//               Food Invoice Only
//             </Button>

//             <Button
//               className="w-full"
//               onClick={() =>
//                 openPrintWindow(
//                   buildCombinedInvoice(
//                     booking,
//                     hotel,
//                     billingData,
//                     roomOrders,
//                     finalPaymentReceived,
//                     finalPaymentMode
//                   )
//                 )
//               }
//             >
//               Full Invoice (Room + Food)
//             </Button>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setInvoiceModal(false)}>
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// }
