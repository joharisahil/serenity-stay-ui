import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { differenceInCalendarDays, startOfDay } from "date-fns";

import type { Booking, BookingSource } from "../hooks/useRoomCalendar";

interface BookingBlockProps {
  booking: Booking;
  calendarStart: Date;
  cellWidth: number;
  totalDays: number; // ✅ REQUIRED
  onClick: (booking: Booking) => void;
  isSelected?: boolean;
}

/* ================= SOURCE STYLES ================= */

const sourceConfig: Record<BookingSource, { bg: string; label: string }> = {
  WALK_IN: { bg: "bg-source-walkin", label: "Walk-in" },
  OTA: { bg: "bg-source-ota", label: "OTA" },
  BANQUET: { bg: "bg-source-banquet", label: "Banquet" },
  CORPORATE: { bg: "bg-source-corporate", label: "Corporate" },
};

/* ================= HELPERS ================= */

function calculateBookingPosition(
  checkIn: string,
  checkOut: string,
  calendarStart: Date,
  cellWidth: number,
  totalDays: number,
) {
  const start = startOfDay(calendarStart);
  const inDate = startOfDay(new Date(checkIn));
  const outDate = startOfDay(new Date(checkOut));

  const startOffset = differenceInCalendarDays(inDate, start);
  const nights = Math.max(1, differenceInCalendarDays(outDate, inDate));

  const rawLeft = startOffset * cellWidth;
  const rawWidth = nights * cellWidth;

  const maxWidth = totalDays * cellWidth;

  // ✅ CLAMP to visible area
  const clampedLeft = Math.max(0, rawLeft);
  const clampedRight = Math.min(rawLeft + rawWidth, maxWidth);
  const clampedWidth = clampedRight - clampedLeft;

  return {
    left: clampedLeft,
    width: clampedWidth,
    nights,
  };
}

/* ================= COMPONENT ================= */

export function BookingBlock({
  booking,
  calendarStart,
  cellWidth,
  totalDays,
  onClick,
  isSelected,
}: BookingBlockProps) {
  const { left, width, nights } = calculateBookingPosition(
    booking.checkIn,
    booking.checkOut,
    calendarStart,
    cellWidth,
    totalDays,
  );

  // ❌ Completely outside view
  if (width <= 0) return null;
  const sourceRaw = booking.source ?? "WALK_IN";

  // 🔒 HARD SAFETY: fallback if unknown value
  const source: BookingSource =
    sourceRaw in sourceConfig ? sourceRaw : "WALK_IN";

  const config = sourceConfig[source];

  const isCompact = width < 110;
  const isVeryCompact = width < 70;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(booking);
      }}
      className={cn(
        "absolute top-1 bottom-1 rounded-lg cursor-pointer",
        "flex items-center gap-2 px-3 overflow-hidden",
        "text-white shadow-booking border border-white/20",
        booking.status === "BLOCKED"
          ? "bg-slate-600"
          : booking.status === "MAINTENANCE"
            ? "bg-orange-500"
            : config.bg,

        isSelected && "ring-2 ring-accent ring-offset-1 z-20 scale-[1.02]",
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      title={`${booking.guestName || booking.status} • ${nights}N`}
    >
      {!isVeryCompact && (
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="truncate text-sm font-medium">
            {booking.guestName || booking.status}
          </span>

          {!isCompact && (
            <Badge
              variant="secondary"
              className="bg-white/20 text-white text-[10px] px-1.5 py-0 shrink-0"
            >
              {config.label}
            </Badge>
          )}
        </div>
      )}

      {!isVeryCompact && (
        <span className="text-xs opacity-80 shrink-0">{nights}N</span>
      )}
    </div>
  );
}
