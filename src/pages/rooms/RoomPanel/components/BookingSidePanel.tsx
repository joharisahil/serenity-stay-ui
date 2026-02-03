import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import type {
  Booking,
  BookingStatus,
  BookingSource,
} from "../hooks/useRoomCalendar";

interface BookingSidePanelProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, booking: Booking) => void;
}

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
    className: "bg-red-100 text-red-700 border-red-200",
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
  WALK_IN: { label: "WALK IN", className: "bg-source-direct text-white" },
  OTA: { label: "OTA", className: "bg-source-ota text-white" },
  BANQUET: { label: "Banquet", className: "bg-source-banquet text-white" },
  CORPORATE: { label: "Corporate", className: "bg-source-corporate text-white" },
};

/* ================= COMPONENT ================= */

export function BookingSidePanel({
  booking,
  isOpen,
  onClose,
  onAction,
}: BookingSidePanelProps) {
  if (!booking) return null;

  const nights = Math.max(
    1,
    differenceInCalendarDays(
      parseISO(booking.checkOut),
      parseISO(booking.checkIn)
    )
  );

  const statusCfg = statusConfig[booking.status];
  const sourceCfg = sourceConfig[booking.source || "DIRECT"];
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
  className={cn(
    "fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-xl z-50",
    "transform transition-transform duration-300",
    isOpen ? "translate-x-0" : "translate-x-full"
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
          <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">

            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge className={cn("border", statusCfg.className)}>
                {statusCfg.label}
              </Badge>
              <Badge className={sourceCfg.className}>
                {sourceCfg.label}
              </Badge>
            </div>

            {/* Guest */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase text-muted-foreground">
                Guest
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {booking.guestName || booking.status}
                  </span>
                </div>

                {/* {booking.guestPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.guestPhone}</span>
                  </div>
                )} */}

                {/* {booking.guestEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.guestEmail}</span>
                  </div>
                )} */}
              </div>
            </div>

            {/* Stay */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase text-muted-foreground">
                Stay
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Check-in</span>
                  <span className="font-medium">
                    {format(parseISO(booking.checkIn), "dd MMM yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Check-out</span>
                  <span className="font-medium">
                    {format(parseISO(booking.checkOut), "dd MMM yyyy")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm">Nights</span>
                  <span className="font-medium">{nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Room</span>
                  <span className="font-medium">
                    {booking.room_id?.number}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t p-4 space-y-2 shrink-0 bg-background">

            {booking.status === "CONFIRMED" && (
              <Button
                className="w-full"
                onClick={() => onAction("check-in", booking)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Check In
              </Button>
            )}

            {booking.status === "OCCUPIED" && (
              <Button
                className="w-full"
                onClick={() => onAction("check-out", booking)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Check Out
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onAction("extend", booking)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Extend
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction("change-room", booking)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Change
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
          <Button
  variant="outline"
  onClick={() => {
    onClose();
    navigate(`/rooms/bookings/${booking.room_id?._id}`);
  }}
>
  <Edit className="mr-2 h-4 w-4" />
  View Details
</Button>


              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => onAction("cancel", booking)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
