import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Booking, BookingSource } from "@/api/bookingApi";
import { calculateBookingPosition, calculateNights } from "@/utils/calendar";

interface BookingBlockProps {
  booking: Booking;
  calendarStart: Date;
  cellWidth: number;
  onClick: (booking: Booking) => void;
  isSelected?: boolean;
}

const sourceConfig: Record<BookingSource, { bg: string; label: string }> = {
  WALK_IN: { bg: "bg-source-walkin", label: "Walk-in" },
  PHONE: { bg: "bg-source-phone", label: "Phone" },
  OTA: { bg: "bg-source-ota", label: "OTA" },
  BANQUET: { bg: "bg-source-banquet", label: "Banquet" },
};

export function BookingBlock({
  booking,
  calendarStart,
  cellWidth,
  onClick,
  isSelected,
}: BookingBlockProps) {
  const { left, width, startOffset } = calculateBookingPosition(
    booking.checkIn,
    booking.checkOut,
    calendarStart,
    cellWidth
  );

  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const config = sourceConfig[booking.source];
  const isCompact = width < 100;
  const isVeryCompact = width < 70;

  // Don't render if booking is completely outside visible range
  if (left + width < 0 || left > cellWidth * 14) {
    return null;
  }

  // Clamp position to visible area
  const clampedLeft = Math.max(left, 0);
  const clampedWidth = Math.min(width - (clampedLeft - left), cellWidth * 14 - clampedLeft);

  if (clampedWidth <= 0) return null;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking);
      }}
      className={cn(
        "booking-block absolute top-1 bottom-1 rounded-lg cursor-pointer",
        "flex items-center gap-2 px-3 overflow-hidden",
        "border shadow-booking",
        config.bg,
        "text-white font-medium",
        isSelected && "ring-2 ring-offset-2 ring-accent scale-[1.02] z-20",
        booking.status === "CHECKED_IN" && "border-white/30",
        booking.status === "CONFIRMED" && "border-white/20 opacity-90",
        booking.status === "CANCELLED" && "opacity-50 line-through"
      )}
      style={{
        left: `${clampedLeft}px`,
        width: `${clampedWidth}px`,
      }}
      title={`${booking.guestName} • ${nights} night${nights > 1 ? "s" : ""}`}
    >
      {!isVeryCompact && (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="truncate text-sm">
            {booking.guestName}
          </span>
          
          {!isCompact && (booking.source === "OTA" || booking.source === "BANQUET") && (
            <Badge
              variant="secondary"
              className="shrink-0 bg-white/20 text-white text-[10px] px-1.5 py-0"
            >
              {booking.source === "OTA" ? booking.otaName || "OTA" : "Banquet"}
            </Badge>
          )}
        </div>
      )}
      
      {!isVeryCompact && (
        <span className="text-xs opacity-80 shrink-0">
          {nights}N
        </span>
      )}
    </div>
  );
}
