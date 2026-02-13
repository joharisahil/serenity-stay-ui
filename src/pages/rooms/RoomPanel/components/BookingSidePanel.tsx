import {
  X,
  User,
  Phone,
  Users,
  Edit,
  IndianRupee,
  LogIn,
  LogOut,
  Moon,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

import "../css/RoomCalendar.css";
import type {
  Booking,
  BookingStatus,
  BookingSource,
} from "../hooks/useRoomCalendar";
import { unblockRoomApi } from "@/api/bookingApi";

interface BookingSidePanelProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  refetch?: () => void;
}
const formatToIST = (dateString: string) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(dateString));
};

/* ================= CONFIG ================= */

const statusConfig: Record<
  BookingStatus,
  { label: string; className: string }
> = {
  OCCUPIED: {
    label: "Occupied",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  BLOCKED: {
    label: "Blocked",
    className: "bg-slate-600 text-white border-slate-600",
  },

  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

const sourceConfig: Record<
  BookingSource,
  { label: string; className: string }
> = {
  WALK_IN: { label: "WALK IN", className: "" },
  OTA: { label: "OTA", className: "" },
  BANQUET: { label: "Banquet", className: "" },
  CORPORATE: { label: "Corporate", className: "" },
};

/* ================= COMPONENT ================= */

export function BookingSidePanel({
  booking,
  isOpen,
  onClose,
  refetch,
}: BookingSidePanelProps) {
  const navigate = useNavigate();
  const [isUnblocking, setIsUnblocking] = useState(false);

  if (!booking) return null;

  const isBlocked = booking.status === "BLOCKED";

  const nights = Math.max(
    1,
    Math.ceil(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  const handleUnblock = async () => {
    if (!booking?._id) return;

    try {
      setIsUnblocking(true);

      await unblockRoomApi(booking._id);
      await refetch?.();

      toast.success("Room unblocked successfully");
      refetch?.();
      onClose();

      // OPTIONAL: if you pass refetch from parent later
      // refetch?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to unblock room");
    } finally {
      setIsUnblocking(false);
    }
  };

  const statusCfg = statusConfig[booking.status];
  const sourceCfg = sourceConfig[booking.source];

  const guests = (booking as any).guests;
  const payment = (booking as any).payment;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-xl z-50",
          "transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Booking</h2>
              <p className="text-sm text-muted-foreground">
                Room {booking.room_id?.number}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={cn("border", statusCfg.className)}>
                {statusCfg.label}
              </Badge>

              <Badge
                variant="outline"
                className="border-0 text-white"
                style={{
                  backgroundColor:
                    booking.source === "WALK_IN"
                      ? "hsl(var(--source-walkin))"
                      : booking.source === "OTA"
                        ? "hsl(var(--source-ota))"
                        : booking.source === "BANQUET"
                          ? "hsl(var(--source-banquet))"
                          : "hsl(var(--source-corporate))",
                }}
              >
                {sourceCfg.label}
              </Badge>
            </div>

            {/* ================= BLOCKED VIEW ================= */}
            {isBlocked ? (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs uppercase text-muted-foreground">
                    Stay Details
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Check-in
                      </span>
                      <span className="font-medium">
                        {formatToIST(booking.checkIn)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Check-out
                      </span>
                      <span className="font-medium">
                        {formatToIST(booking.checkOut)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Nights
                      </span>
                      <span className="font-medium">{nights}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guest Information */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase text-muted-foreground">
                    Guest Information
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Guest
                        </span>
                      </div>
                      <span className="font-medium">{guests?.name}</span>
                    </div>

                    {guests?.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Phone
                          </span>
                        </div>
                        <span className="font-medium">{guests.phone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Guests
                        </span>
                      </div>
                      <span className="font-medium">
                        {guests?.adults} Adult
                        {guests?.adults > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase text-muted-foreground">
                    Stay Details
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Check-in
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatToIST(booking.checkIn)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Check-out
                        </span>
                      </div>
                      <span className="font-medium">
                        {formatToIST(booking.checkOut)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Nights
                        </span>
                      </div>
                      <span className="font-medium">{nights}</span>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase text-muted-foreground">
                    Payment
                  </h3>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Total
                        </span>
                      </div>
                      <span className="font-medium">₹{payment?.total}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Paid
                        </span>
                      </div>
                      <span className="font-medium">₹{payment?.paid}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-4 bg-background">
            {isBlocked ? (
              <div className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={isUnblocking}
                    >
                      {isUnblocking ? "Unblocking..." : "Unblock Room"}
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unblock this room?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the block and make the room available
                        for booking. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>

                      <AlertDialogAction
                        onClick={handleUnblock}
                        className="bg-slate-700 hover:bg-slate-800 text-white"
                      >
                        Confirm Unblock
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  className="w-full"
                  onClick={() => {
                    onClose();
                    navigate("/rooms/bookings/create", {
                      state: {
                        mode: "CONVERT",
                        bookingId: booking._id,
                        checkIn: booking.checkIn,
                        checkOut: booking.checkOut,
                        room: booking.room_id,
                        roomId: booking.room_id?._id,
                        roomType: booking.room_id?.type,
                        source: booking.source,
                      },
                    });
                  }}
                >
                  Convert to Booking
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  onClose();
                  navigate(`/rooms/bookings/${booking._id}`, {
                    state: { bookingId: booking._id },
                  });
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// import {
//   X,
//   User,
//   Phone,
//   Users,
//   Edit,
//   IndianRupee,
//   LogIn,
//   LogOut,
//   Moon,
// } from "lucide-react";
// import { format, parseISO, differenceInCalendarDays } from "date-fns";
// import { useNavigate } from "react-router-dom";

// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { cn } from "@/lib/utils";
// import "../css/RoomCalendar.css";
// import type {
//   Booking,
//   BookingStatus,
//   BookingSource,
// } from "../hooks/useRoomCalendar";

// interface BookingSidePanelProps {
//   booking: Booking | null;
//   isOpen: boolean;
//   onClose: () => void;
// }

// /* ================= CONFIG ================= */

// const statusConfig: Record<
//   BookingStatus,
//   { label: string; className: string }
// > = {
//   OCCUPIED: {
//     label: "Occupied",
//     className: "bg-green-100 text-green-700 border-green-200",
//   },
//   CONFIRMED: {
//     label: "Confirmed",
//     className: "bg-blue-100 text-blue-700 border-blue-200",
//   },
//   BLOCKED: {
//   label: "Blocked",
//   className: "bg-muted text-muted-foreground border-border",
// },

//   MAINTENANCE: {
//     label: "Maintenance",
//     className: "bg-orange-100 text-orange-700 border-orange-200",
//   },
// };

// const sourceConfig: Record<
//   BookingSource,
//   { label: string; className: string }
// > = {
//   WALK_IN: { label: "WALK IN", className: "bg-source-direct text-white" },
//   OTA: { label: "OTA", className: "bg-source-ota text-white" },
//   BANQUET: { label: "Banquet", className: "bg-source-banquet text-white" },
//   CORPORATE: {
//     label: "Corporate",
//     className: "bg-source-corporate text-white",
//   },
// };

// /* ================= COMPONENT ================= */

// export function BookingSidePanel({
//   booking,
//   isOpen,
//   onClose,
// }: BookingSidePanelProps) {
//   if (!booking) return null;

// const isBlocked = booking.status === "BLOCKED";

//   const navigate = useNavigate();

//   if (!booking) return null;

//   const nights = Math.max(
//     1,
//     differenceInCalendarDays(
//       parseISO(booking.checkOut),
//       parseISO(booking.checkIn),
//     ),
//   );

//   const statusCfg = statusConfig[booking.status];
//   const sourceCfg = sourceConfig[booking.source];

//   const guests = booking.guests;
//   const payment = booking.payment;

//   return (
//     <>
//       {/* Backdrop */}
//       <div
//         className={cn(
//           "fixed inset-0 bg-black/30 z-40 transition-opacity",
//           isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
//         )}
//         onClick={onClose}
//       />

//       {/* Panel */}
//       <div
//         className={cn(
//           "fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-xl z-50",
//           "transform transition-transform duration-300",
//           isOpen ? "translate-x-0" : "translate-x-full",
//         )}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="flex items-center justify-between p-4 border-b">
//             <div>
//               <h2 className="text-lg font-semibold">Booking</h2>
//               <p className="text-sm text-muted-foreground">
//                 Room {booking.room_id?.number}
//               </p>
//             </div>
//             <Button variant="ghost" size="icon" onClick={onClose}>
//               <X className="h-5 w-5" />
//             </Button>
//           </div>

//           {/* Content */}
//           <div className="flex-1 overflow-y-auto p-4 space-y-6">
//             {/* Status */}
//             <div className="flex items-center gap-2">
//               <Badge className={cn("border", statusCfg.className)}>
//                 {statusCfg.label}
//               </Badge>
//               <Badge
//                 variant="outline"
//                 className="border-0 text-white"
//                 style={{
//                   backgroundColor:
//                     booking.source === "WALK_IN"
//                       ? "hsl(var(--source-walkin))"
//                       : booking.source === "OTA"
//                         ? "hsl(var(--source-ota))"
//                         : booking.source === "BANQUET"
//                           ? "hsl(var(--source-banquet))"
//                           : "hsl(var(--source-corporate))",
//                 }}
//               >
//                 {sourceCfg.label}
//               </Badge>
//             </div>

//             {/* Guest Information */}
//             <div className="space-y-3">
//               <h3 className="text-xs uppercase text-muted-foreground">
//                 Guest Information
//               </h3>

//               <div className="bg-muted/50 rounded-lg p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <User className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">Guest</span>
//                   </div>
//                   <span className="font-medium">{guests.name}</span>
//                 </div>

//                 {guests.phone && (
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Phone className="h-4 w-4 text-primary" />
//                       <span className="text-sm text-muted-foreground">
//                         Phone
//                       </span>
//                     </div>
//                     <span className="font-medium">{guests.phone}</span>
//                   </div>
//                 )}

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Users className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">
//                       Guests
//                     </span>
//                   </div>
//                   <span className="font-medium">
//                     {guests.adults} Adult{guests.adults > 1 ? "s" : ""}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Stay Details */}
//             <div className="space-y-3">
//               <h3 className="text-xs uppercase text-muted-foreground">
//                 Stay Details
//               </h3>

//               <div className="bg-muted/50 rounded-lg p-4 space-y-3">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <LogIn className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">
//                       Check-in
//                     </span>
//                   </div>
//                   <span className="font-medium">
//                     {format(parseISO(booking.checkIn), "dd MMM yyyy")}
//                   </span>
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <LogOut className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">
//                       Check-out
//                     </span>
//                   </div>
//                   <span className="font-medium">
//                     {format(parseISO(booking.checkOut), "dd MMM yyyy")}
//                   </span>
//                 </div>

//                 <Separator />

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Moon className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">
//                       Nights
//                     </span>
//                   </div>
//                   <span className="font-medium">{nights}</span>
//                 </div>
//               </div>
//             </div>

//             {/* Payment */}
//             <div className="space-y-3">
//               <h3 className="text-xs uppercase text-muted-foreground">
//                 Payment
//               </h3>

//               <div className="bg-muted/50 rounded-lg p-4 space-y-2">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <IndianRupee className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">Total</span>
//                   </div>
//                   <span className="font-medium">₹{payment.total}</span>
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <IndianRupee className="h-4 w-4 text-primary" />
//                     <span className="text-sm text-muted-foreground">Paid</span>
//                   </div>
//                   <span className="font-medium">₹{payment.paid}</span>
//                 </div>

//                 <Badge
//                   className={cn(
//                     "mt-2 w-fit",
//                     payment.status === "PAID"
//                       ? "bg-green-600 text-white"
//                       : payment.status === "PARTIAL"
//                         ? "bg-yellow-500 text-black"
//                         : "bg-red-600 text-white",
//                   )}
//                 >
//                   {payment.status}
//                 </Badge>
//               </div>
//             </div>
//           </div>

//           {/* SINGLE ACTION */}
//           <div className="border-t p-4 bg-background">
//             <Button
//               className="w-full"
//               onClick={() => {
//                 onClose();
//                 navigate(`/rooms/bookings/${booking._id}`, {
//                   state: { bookingId: booking._id },
//                 });
//               }}
//             >
//               <Edit className="mr-2 h-4 w-4" />
//               View Details
//             </Button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }
