import { X, User, Phone, Mail, Calendar, CreditCard, Clock, MapPin, Users, ArrowRight, Edit, Trash2, LogIn, LogOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus, BookingSource } from "@/api/bookingApi";
import { format, parseISO } from "date-fns";
import { calculateNights } from "@/utils/calendar";

interface BookingSidePanelProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string, booking: Booking) => void;
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  CONFIRMED: { label: "Confirmed", className: "bg-blue-100 text-blue-700 border-blue-200" },
  CHECKED_IN: { label: "Checked In", className: "bg-green-100 text-green-700 border-green-200" },
  CHECKED_OUT: { label: "Checked Out", className: "bg-gray-100 text-gray-700 border-gray-200" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700 border-red-200" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const sourceConfig: Record<BookingSource, { label: string; className: string }> = {
  WALK_IN: { label: "Walk-in", className: "bg-source-walkin text-white" },
  PHONE: { label: "Phone", className: "bg-source-phone text-white" },
  OTA: { label: "OTA", className: "bg-source-ota text-white" },
  BANQUET: { label: "Banquet", className: "bg-source-banquet text-white" },
};

export function BookingSidePanel({
  booking,
  isOpen,
  onClose,
  onAction,
}: BookingSidePanelProps) {
  if (!booking) return null;

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const balance = booking.totalAmount - booking.paidAmount;
  const statusCfg = statusConfig[booking.status];
  const sourceCfg = sourceConfig[booking.source];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md bg-panel border-l shadow-panel z-50",
          "transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-semibold">Booking Details</h2>
              <p className="text-sm text-muted-foreground">Room {booking.roomNumber}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Status & Source Badges */}
            <div className="flex items-center gap-2">
              <Badge className={cn("border", statusCfg.className)}>
                {statusCfg.label}
              </Badge>
              <Badge className={sourceCfg.className}>
                {booking.source === "OTA" && booking.otaName
                  ? booking.otaName
                  : sourceCfg.label}
              </Badge>
            </div>

            {/* Guest Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Guest Information
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{booking.guestName}</span>
                </div>
                {booking.guestEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.guestEmail}</span>
                  </div>
                )}
                {booking.guestPhone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{booking.guestPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {booking.adults} Adult{booking.adults > 1 ? "s" : ""}
                    {booking.children > 0 && `, ${booking.children} Child${booking.children > 1 ? "ren" : ""}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Stay Details
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Check-in</span>
                  </div>
                  <span className="font-medium">
                    {format(parseISO(booking.checkIn), "EEE, MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Check-out</span>
                  </div>
                  <span className="font-medium">
                    {format(parseISO(booking.checkOut), "EEE, MMM d, yyyy")}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Duration</span>
                  </div>
                  <span className="font-medium">
                    {nights} Night{nights > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Room</span>
                  </div>
                  <span className="font-medium">{booking.roomNumber}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Payment
              </h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Amount</span>
                  <span className="font-medium">₹{booking.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Paid</span>
                  <span className="font-medium text-green-600">
                    ₹{booking.paidAmount.toLocaleString()}
                  </span>
                </div>
                {balance > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Balance Due</span>
                      <span className="font-bold text-destructive">
                        ₹{balance.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Banquet Details */}
            {booking.source === "BANQUET" && booking.banquetDetails && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Event Details
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{booking.banquetDetails}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Notes
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm">{booking.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions Footer */}
          <div className="border-t p-4 space-y-3">
            {booking.status === "CONFIRMED" && (
              <Button
                className="w-full"
                onClick={() => onAction("check-in", booking)}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Check In Guest
              </Button>
            )}

            {booking.status === "CHECKED_IN" && (
              <Button
                className="w-full"
                onClick={() => onAction("check-out", booking)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Check Out Guest
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onAction("change-room", booking)}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Change Room
              </Button>
              <Button
                variant="outline"
                onClick={() => onAction("extend", booking)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Extend Stay
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => onAction("edit", booking)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
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
